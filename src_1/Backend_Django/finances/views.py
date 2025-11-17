from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from . import models, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models.deletion import RestrictedError
from django.db import IntegrityError
import logging

logger = logging.getLogger(__name__)


class RegisterAPIView(APIView):
    permission_classes = []  # allow any

    def post(self, request):
        # No temporary debug logging (removed after verification)

        serializer = serializers.RegisterSerializer(data=request.data)
        if serializer.is_valid():
            created = serializer.save()
            return Response({'token': created.get('token'), 'usuario_id': created.get('usuario').usuario_id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = models.Usuario.objects.all()
    serializer_class = serializers.UsuarioSerializer
    # Allow unauthenticated users to create (register). Other actions require authentication.
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # AllowAnyone for create (registration), otherwise require IsAuthenticated
        if self.action == 'create':
            from rest_framework.permissions import AllowAny

            return [AllowAny()]
        return [p() for p in self.permission_classes]

    def create(self, request, *args, **kwargs):
        # Create user and return token in response for convenience
        response = super().create(request, *args, **kwargs)
        # Generate token for the new user
        try:
            from rest_framework.authtoken.models import Token
            # serializer saved instance is in response.data['usuario_id'] or 'id'
            # Retrieve user by email if present
            email = response.data.get('email')
            if email:
                user = models.Usuario.objects.filter(email=email).first()
            else:
                # fallback: try to extract usuario_id
                usuario_id = response.data.get('usuario_id') or response.data.get('id')
                user = models.Usuario.objects.filter(usuario_id=usuario_id).first() if usuario_id else None
            if user:
                token, _ = Token.objects.get_or_create(user=user)
                # append token to response data
                response.data['token'] = token.key
        except Exception:
            # don't block user creation if token creation fails
            pass
        return response

    @action(detail=False, methods=['get'], url_path='check-email', permission_classes=[])
    def check_email(self, request):
        """
        Verificar si un email existe en el sistema.
        Parámetro: email (query param)
        """
        email = request.query_params.get('email')
        if not email:
            return Response({'detail': 'El parámetro email es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        exists = models.Usuario.objects.filter(email=email).exists()
        return Response({'exists': exists, 'email': email}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """
        Obtener la información del usuario actual autenticado
        """
        user = request.user
        if not user or user.is_anonymous:
            return Response({'detail': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({
            'usuario_id': user.usuario_id,
            'email': user.email,
            'nombre': user.nombre
        }, status=status.HTTP_200_OK)


class GrupoViewSet(viewsets.ModelViewSet):
    queryset = models.Grupo.objects.all()
    serializer_class = serializers.GrupoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Devolver solo los grupos donde el usuario es miembro
        """
        user = self.request.user
        if not user or user.is_anonymous:
            return models.Grupo.objects.none()
        # Obtener los IDs de grupos donde el usuario es miembro
        grupos_ids = models.UsuarioGrupo.objects.filter(usuario=user).values_list('grupo', flat=True)
        return models.Grupo.objects.filter(grupo_id__in=grupos_ids)

    def perform_create(self, serializer):
        """
        Al crear un grupo, automáticamente agregar al usuario creador como admin
        y crear un bolsillo "General" para recibir aportaciones
        """
        grupo = serializer.save(creador=self.request.user)
        # Agregar al usuario actual como admin del grupo
        models.UsuarioGrupo.objects.create(
            usuario=self.request.user,
            grupo=grupo,
            rol='admin'
        )
        # Crear bolsillo "General" automáticamente con saldo 0
        models.Bolsillo.objects.create(
            nombre='General',
            saldo=0,
            grupo=grupo,
            usuario=None  # No tiene usuario porque es del grupo
        )



class BolsilloViewSet(viewsets.ModelViewSet):
    queryset = models.Bolsillo.objects.all()
    serializer_class = serializers.BolsilloSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return models.Bolsillo.objects.none()
        
        # Filtrar por grupo específico si se proporciona grupo_id
        grupo_id = self.request.query_params.get('grupo_id')
        if grupo_id:
            # Obtener todos los grupos donde el usuario es miembro
            grupos_ids = models.UsuarioGrupo.objects.filter(usuario=user).values_list('grupo', flat=True)
            
            # Verificar que el usuario sea miembro del grupo
            if int(grupo_id) not in grupos_ids:
                return models.Bolsillo.objects.none()
            return models.Bolsillo.objects.filter(grupo_id=grupo_id)
        
        # Si no hay grupo_id, mostrar SOLO bolsillos personales (sin grupo)
        return models.Bolsillo.objects.filter(usuario=user, grupo__isnull=True)

    def perform_create(self, serializer):
        from django.db.models import Sum
        from rest_framework.exceptions import ValidationError
        
        user = self.request.user
        grupo_id = self.request.data.get('grupo_id') or self.request.data.get('grupo')
        monto_bolsillo = serializer.validated_data.get('saldo', 0)
        
        if grupo_id:
            # Verificar que el usuario sea miembro del grupo
            es_miembro = models.UsuarioGrupo.objects.filter(
                usuario=user,
                grupo_id=grupo_id
            ).exists()
            if not es_miembro:
                raise ValidationError({'detail': 'No eres miembro de este grupo'})
            
            # Si se especifica un monto inicial, transferir desde el bolsillo General
            if monto_bolsillo > 0:
                # Buscar el bolsillo "General" del grupo
                try:
                    bolsillo_general = models.Bolsillo.objects.get(
                        grupo_id=grupo_id,
                        nombre='General'
                    )
                except models.Bolsillo.DoesNotExist:
                    raise ValidationError({
                        'detail': 'No se encontró el bolsillo General del grupo. Crea primero el bolsillo General.'
                    })
                
                # Verificar que el bolsillo General tenga saldo suficiente
                if bolsillo_general.saldo < monto_bolsillo:
                    raise ValidationError({
                        'detail': f'Saldo insuficiente en el bolsillo General. Saldo disponible: ${bolsillo_general.saldo:.2f}',
                        'saldo_disponible': float(bolsillo_general.saldo)
                    })
                
                # Crear el bolsillo primero con saldo 0
                nuevo_bolsillo = serializer.save(grupo_id=grupo_id, saldo=0)
                
                # Realizar la transferencia interna
                bolsillo_general.saldo -= monto_bolsillo
                bolsillo_general.save()
                
                nuevo_bolsillo.saldo = monto_bolsillo
                nuevo_bolsillo.save()
            else:
                # Crear bolsillo sin saldo inicial
                serializer.save(grupo_id=grupo_id)
        else:
            serializer.save(usuario=user)

    def perform_update(self, serializer):
        from rest_framework.exceptions import ValidationError
        
        bolsillo = self.get_object()
        nuevo_saldo = serializer.validated_data.get('saldo', bolsillo.saldo)
        saldo_anterior = bolsillo.saldo
        
        # Solo validar si el bolsillo pertenece a un grupo Y el saldo cambió
        if bolsillo.grupo and nuevo_saldo != saldo_anterior:
            # No permitir editar el saldo del bolsillo General directamente
            if bolsillo.nombre == 'General':
                raise ValidationError({
                    'detail': 'No puedes editar el saldo del bolsillo General directamente. El saldo se actualiza automáticamente con las transacciones del grupo.'
                })
            
            # Buscar el bolsillo General
            try:
                bolsillo_general = models.Bolsillo.objects.get(
                    grupo=bolsillo.grupo,
                    nombre='General'
                )
            except models.Bolsillo.DoesNotExist:
                raise ValidationError({
                    'detail': 'No se encontró el bolsillo General del grupo.'
                })
            
            # Calcular la diferencia
            diferencia = nuevo_saldo - saldo_anterior
            
            if diferencia > 0:
                # Aumentar saldo: transferir desde General
                if bolsillo_general.saldo < diferencia:
                    raise ValidationError({
                        'detail': f'Saldo insuficiente en el bolsillo General. Saldo disponible: ${bolsillo_general.saldo:.2f}, necesitas: ${diferencia:.2f}',
                        'saldo_disponible': float(bolsillo_general.saldo)
                    })
                bolsillo_general.saldo -= diferencia
                bolsillo_general.save()
            else:
                # Disminuir saldo: devolver a General
                bolsillo_general.saldo += abs(diferencia)
                bolsillo_general.save()
        
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Override destroy to return a friendly error when DB restricts deletion (e.g. transferencias)."""
        try:
            return super().destroy(request, *args, **kwargs)
        except RestrictedError:
            return Response({'detail': 'No se puede eliminar este bolsillo porque tiene transferencias relacionadas.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'detail': 'Error al eliminar el bolsillo.'}, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as e:
            return Response({'detail': 'Ya existe un bolsillo con ese nombre para este usuario o grupo.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            # Re-lanzar ValidationError para que se muestre el mensaje específico
            raise e
        except Exception as e:
            logger.error(f"Error al crear bolsillo: {str(e)}")
            return Response({'detail': f'Error al crear el bolsillo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except IntegrityError:
            return Response({'detail': 'No se puede actualizar: nombre duplicado para este usuario o grupo.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            # Re-lanzar ValidationError para que se muestre el mensaje específico
            raise e
        except Exception as e:
            logger.error(f"Error al actualizar bolsillo: {str(e)}")
            return Response({'detail': f'Error al actualizar el bolsillo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = models.Categoria.objects.all()
    serializer_class = serializers.CategoriaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return models.Categoria.objects.none()
        
        # Filtrar por grupo específico si se proporciona grupo_id
        grupo_id = self.request.query_params.get('grupo_id')
        if grupo_id:
            # Verificar que el usuario sea miembro del grupo
            es_miembro = models.UsuarioGrupo.objects.filter(
                usuario=user,
                grupo_id=grupo_id
            ).exists()
            if not es_miembro:
                return models.Categoria.objects.none()
            return models.Categoria.objects.filter(grupo_id=grupo_id)
        
        # Si no hay grupo_id, mostrar solo categorías personales del usuario
        return models.Categoria.objects.filter(usuario=user)

    def perform_create(self, serializer):
        user = self.request.user
        grupo_id = self.request.data.get('grupo_id') or self.request.data.get('grupo')
        
        if grupo_id:
            # Verificar que el usuario sea miembro del grupo
            es_miembro = models.UsuarioGrupo.objects.filter(
                usuario=user,
                grupo_id=grupo_id
            ).exists()
            if not es_miembro:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'detail': 'No eres miembro de este grupo'})
            serializer.save(grupo_id=grupo_id)
        else:
            serializer.save(usuario=user)


class TransferenciaViewSet(viewsets.ModelViewSet):
    queryset = models.Transferencia.objects.all()
    serializer_class = serializers.TransferenciaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return models.Transferencia.objects.none()
        grupos = models.UsuarioGrupo.objects.filter(usuario=user).values_list('grupo', flat=True)
        return models.Transferencia.objects.filter(
            Q(de_bolsillo__usuario=user) | Q(a_bolsillo__usuario=user) | Q(de_bolsillo__grupo__in=grupos) | Q(a_bolsillo__grupo__in=grupos)
        )


class IngresoViewSet(viewsets.ModelViewSet):
    queryset = models.Ingreso.objects.all()
    serializer_class = serializers.IngresoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return models.Ingreso.objects.none()
        
        # Filtrar por grupo específico si se proporciona grupo_id
        grupo_id = self.request.query_params.get('grupo_id')
        if grupo_id:
            # Obtener todos los grupos donde el usuario es miembro
            grupos_ids = models.UsuarioGrupo.objects.filter(usuario=user).values_list('grupo', flat=True)
            
            # Verificar que el usuario sea miembro del grupo
            if int(grupo_id) not in grupos_ids:
                return models.Ingreso.objects.none()
            return models.Ingreso.objects.filter(grupo_id=grupo_id)
        
        # Si no hay grupo_id, mostrar SOLO ingresos personales (sin grupo)
        return models.Ingreso.objects.filter(usuario=user, grupo__isnull=True)

    def perform_create(self, serializer):
        user = self.request.user
        bolsillo = serializer.validated_data.get('bolsillo')
        monto = serializer.validated_data.get('monto', 0)
        grupo_id = self.request.data.get('grupo_id') or self.request.data.get('grupo')
        
        # Actualizar saldo del bolsillo (sumar ingreso)
        if bolsillo and monto:
            bolsillo.saldo += monto
            bolsillo.save()
        
        if grupo_id:
            # Verificar que el usuario sea miembro del grupo
            es_miembro = models.UsuarioGrupo.objects.filter(
                usuario=user,
                grupo_id=grupo_id
            ).exists()
            if not es_miembro:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'detail': 'No eres miembro de este grupo'})
            # Importante: NO setear usuario para transacciones de grupo (restricción XOR)
            # pero SÍ guardar quién la creó en creado_por
            serializer.save(grupo_id=grupo_id, creado_por=user)
        else:
            serializer.save(usuario=user, creado_por=user)
    
    def perform_update(self, serializer):
        # Obtener el ingreso original antes de actualizar
        ingreso_original = self.get_object()
        bolsillo_original = ingreso_original.bolsillo
        monto_original = ingreso_original.monto
        
        # Revertir el saldo original si había bolsillo
        if bolsillo_original and monto_original:
            bolsillo_original.saldo -= monto_original
            bolsillo_original.save()
        
        # Aplicar el nuevo monto al bolsillo nuevo o actualizado
        bolsillo_nuevo = serializer.validated_data.get('bolsillo')
        monto_nuevo = serializer.validated_data.get('monto', 0)
        
        if bolsillo_nuevo and monto_nuevo:
            bolsillo_nuevo.saldo += monto_nuevo
            bolsillo_nuevo.save()
        
        serializer.save()
    
    def perform_destroy(self, instance):
        # Revertir el saldo al eliminar
        if instance.bolsillo and instance.monto:
            instance.bolsillo.saldo -= instance.monto
            instance.bolsillo.save()
        instance.delete()


class EgresoViewSet(viewsets.ModelViewSet):
    queryset = models.Egreso.objects.all()
    serializer_class = serializers.EgresoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return models.Egreso.objects.none()
        
        # Filtrar por grupo específico si se proporciona grupo_id
        grupo_id = self.request.query_params.get('grupo_id')
        if grupo_id:
            # Obtener todos los grupos donde el usuario es miembro
            grupos_ids = models.UsuarioGrupo.objects.filter(usuario=user).values_list('grupo', flat=True)
            
            # Verificar que el usuario sea miembro del grupo
            if int(grupo_id) not in grupos_ids:
                return models.Egreso.objects.none()
            return models.Egreso.objects.filter(grupo_id=grupo_id)
        
        # Si no hay grupo_id, mostrar SOLO egresos personales (sin grupo)
        return models.Egreso.objects.filter(usuario=user, grupo__isnull=True)

    def perform_create(self, serializer):
        user = self.request.user
        bolsillo = serializer.validated_data.get('bolsillo')
        monto = serializer.validated_data.get('monto', 0)
        grupo_id = self.request.data.get('grupo_id') or self.request.data.get('grupo')
        
        # Validar que hay saldo suficiente en el bolsillo
        if bolsillo and monto:
            if bolsillo.saldo < monto:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({
                    'detail': f'Saldo insuficiente en el bolsillo "{bolsillo.nombre}". Saldo disponible: ${bolsillo.saldo}, monto requerido: ${monto}'
                })
            
            # Actualizar saldo del bolsillo (restar egreso)
            bolsillo.saldo -= monto
            bolsillo.save()
        
        if grupo_id:
            # Verificar que el usuario sea miembro del grupo
            es_miembro = models.UsuarioGrupo.objects.filter(
                usuario=user,
                grupo_id=grupo_id
            ).exists()
            if not es_miembro:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'detail': 'No eres miembro de este grupo'})
            # Importante: NO setear usuario para transacciones de grupo (restricción XOR)
            # pero SÍ guardar quién la creó en creado_por
            serializer.save(grupo_id=grupo_id, creado_por=user)
        else:
            serializer.save(usuario=user, creado_por=user)
    
    def perform_update(self, serializer):
        # Obtener el egreso original antes de actualizar
        egreso_original = self.get_object()
        bolsillo_original = egreso_original.bolsillo
        monto_original = egreso_original.monto
        
        # Revertir el saldo original si había bolsillo (sumar de vuelta)
        if bolsillo_original and monto_original:
            bolsillo_original.saldo += monto_original
            bolsillo_original.save()
        
        # Validar y aplicar el nuevo monto
        bolsillo_nuevo = serializer.validated_data.get('bolsillo')
        monto_nuevo = serializer.validated_data.get('monto', 0)
        
        if bolsillo_nuevo and monto_nuevo:
            if bolsillo_nuevo.saldo < monto_nuevo:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({
                    'detail': f'Saldo insuficiente en el bolsillo "{bolsillo_nuevo.nombre}". Saldo disponible: ${bolsillo_nuevo.saldo}, monto requerido: ${monto_nuevo}'
                })
            bolsillo_nuevo.saldo -= monto_nuevo
            bolsillo_nuevo.save()
        
        serializer.save()
    
    def perform_destroy(self, instance):
        # Revertir el saldo al eliminar (sumar de vuelta)
        if instance.bolsillo and instance.monto:
            instance.bolsillo.saldo += instance.monto
            instance.bolsillo.save()
        instance.delete()


class MovimientoViewSet(viewsets.ModelViewSet):
    queryset = models.Movimiento.objects.all()
    serializer_class = serializers.MovimientoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return models.Movimiento.objects.none()
        grupos = models.UsuarioGrupo.objects.filter(usuario=user).values_list('grupo', flat=True)
        return models.Movimiento.objects.filter(Q(usuario=user) | Q(grupo__in=grupos))

    def perform_create(self, serializer):
        user = self.request.user
        if user and not serializer.validated_data.get('grupo'):
            serializer.save(usuario=user)
        else:
            serializer.save()

    @action(detail=False, methods=['post'], url_path='transferir')
    def transferir(self, request):
        """
        Transferir dinero entre bolsillos (del mismo usuario o del mismo grupo).
        Requiere: bolsillo_origen_id, bolsillo_destino_id, monto, descripcion (opcional)
        """
        from decimal import Decimal
        from django.db import transaction
        
        user = request.user
        bolsillo_origen_id = request.data.get('bolsillo_origen_id')
        bolsillo_destino_id = request.data.get('bolsillo_destino_id')
        monto = request.data.get('monto')
        descripcion = request.data.get('descripcion', '')
        
        # Validaciones
        if not bolsillo_origen_id:
            raise ValidationError({'detail': 'El bolsillo_origen_id es requerido'})
        if not bolsillo_destino_id:
            raise ValidationError({'detail': 'El bolsillo_destino_id es requerido'})
        if not monto:
            raise ValidationError({'detail': 'El monto es requerido'})
        if bolsillo_origen_id == bolsillo_destino_id:
            raise ValidationError({'detail': 'No puedes transferir al mismo bolsillo'})
        
        try:
            monto = Decimal(str(monto))
            if monto <= 0:
                raise ValidationError({'detail': 'El monto debe ser mayor a 0'})
        except (ValueError, TypeError):
            raise ValidationError({'detail': 'El monto debe ser un número válido'})
        
        # Obtener bolsillos
        try:
            bolsillo_origen = models.Bolsillo.objects.get(bolsillo_id=bolsillo_origen_id)
        except models.Bolsillo.DoesNotExist:
            raise ValidationError({'detail': 'El bolsillo de origen no existe'})
        
        try:
            bolsillo_destino = models.Bolsillo.objects.get(bolsillo_id=bolsillo_destino_id)
        except models.Bolsillo.DoesNotExist:
            raise ValidationError({'detail': 'El bolsillo de destino no existe'})
        
        # Verificar que ambos bolsillos pertenecen al mismo contexto (usuario o grupo)
        if bolsillo_origen.usuario and bolsillo_destino.usuario:
            # Ambos son personales - deben ser del mismo usuario
            if bolsillo_origen.usuario != user or bolsillo_destino.usuario != user:
                raise ValidationError({'detail': 'Solo puedes transferir entre tus propios bolsillos'})
            contexto_usuario = user
            contexto_grupo = None
        elif bolsillo_origen.grupo and bolsillo_destino.grupo:
            # Ambos son de grupo - deben ser del mismo grupo
            if bolsillo_origen.grupo != bolsillo_destino.grupo:
                raise ValidationError({'detail': 'Solo puedes transferir entre bolsillos del mismo grupo'})
            # Verificar que el usuario es miembro del grupo
            es_miembro = models.UsuarioGrupo.objects.filter(
                usuario=user,
                grupo=bolsillo_origen.grupo
            ).exists()
            if not es_miembro:
                raise ValidationError({'detail': 'No eres miembro de este grupo'})
            contexto_usuario = None
            contexto_grupo = bolsillo_origen.grupo
        else:
            raise ValidationError({'detail': 'No puedes transferir entre bolsillos personales y de grupo'})
        
        # Verificar saldo suficiente
        if bolsillo_origen.saldo < monto:
            raise ValidationError({
                'detail': f'Saldo insuficiente. El bolsillo tiene ${bolsillo_origen.saldo}, necesitas ${monto}'
            })
        
        # Realizar la transferencia (atomic para que ambas operaciones se hagan o ninguna)
        with transaction.atomic():
            # Actualizar saldos
            bolsillo_origen.saldo -= monto
            bolsillo_origen.save()
            
            bolsillo_destino.saldo += monto
            bolsillo_destino.save()
            
            # Crear registro de movimiento (egreso del origen)
            movimiento_egreso = models.Movimiento.objects.create(
                tipo='eg',
                monto=monto,
                descripcion=descripcion or f'Transferencia a {bolsillo_destino.nombre}',
                usuario=contexto_usuario,
                grupo=contexto_grupo,
                bolsillo=bolsillo_origen
            )
            
            # Crear registro de movimiento (ingreso al destino)
            movimiento_ingreso = models.Movimiento.objects.create(
                tipo='ing',
                monto=monto,
                descripcion=descripcion or f'Transferencia desde {bolsillo_origen.nombre}',
                usuario=contexto_usuario,
                grupo=contexto_grupo,
                bolsillo=bolsillo_destino
            )
        
        return Response({
            'detail': 'Transferencia realizada exitosamente',
            'bolsillo_origen': {
                'id': bolsillo_origen.bolsillo_id,
                'nombre': bolsillo_origen.nombre,
                'saldo': str(bolsillo_origen.saldo)
            },
            'bolsillo_destino': {
                'id': bolsillo_destino.bolsillo_id,
                'nombre': bolsillo_destino.nombre,
                'saldo': str(bolsillo_destino.saldo)
            },
            'monto': str(monto)
        }, status=status.HTTP_200_OK)


class UsuarioGrupoViewSet(viewsets.ModelViewSet):
    queryset = models.UsuarioGrupo.objects.all()
    serializer_class = serializers.UsuarioGrupoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return models.UsuarioGrupo.objects.none()
        # Obtener todos los grupos donde el usuario es miembro
        grupos = models.UsuarioGrupo.objects.filter(usuario=user).values_list('grupo', flat=True)
        # Retornar todos los miembros de esos grupos
        return models.UsuarioGrupo.objects.filter(grupo__in=grupos)

    @action(detail=False, methods=['post'], url_path='add-by-email')
    def add_by_email(self, request):
        """
        Agregar un usuario a un grupo usando su email.
        Requiere: email, grupo_id, rol (opcional, default 'miembro')
        """
        email = request.data.get('email')
        grupo_id = request.data.get('grupo_id') or request.data.get('grupoId')
        rol = request.data.get('rol', 'miembro')
        
        if not email:
            raise ValidationError({'detail': 'El email es requerido'})
        if not grupo_id:
            raise ValidationError({'detail': 'El ID del grupo es requerido'})
        
        # Verificar que el usuario existe
        try:
            usuario = models.Usuario.objects.get(email=email)
        except models.Usuario.DoesNotExist:
            raise ValidationError({'detail': f'No existe ningún usuario con el email "{email}"'})
        
        # Verificar que el grupo existe
        try:
            grupo = models.Grupo.objects.get(grupo_id=grupo_id)
        except models.Grupo.DoesNotExist:
            raise ValidationError({'detail': 'El grupo no existe'})
        
        # Verificar que el usuario actual tiene permisos en el grupo (debe ser admin)
        user_grupo = models.UsuarioGrupo.objects.filter(
            usuario=request.user,
            grupo=grupo,
            rol='admin'  # Solo los admins pueden agregar usuarios
        ).first()
        
        if not user_grupo:
            raise ValidationError({'detail': 'Solo los administradores del grupo pueden agregar usuarios'})
        
        # Verificar que el usuario no esté ya en el grupo
        existe = models.UsuarioGrupo.objects.filter(
            usuario=usuario,
            grupo=grupo
        ).exists()
        
        if existe:
            raise ValidationError({'detail': f'El usuario {email} ya es miembro de este grupo'})
        
        # Crear la relación usuario-grupo
        usuario_grupo = models.UsuarioGrupo.objects.create(
            usuario=usuario,
            grupo=grupo,
            rol=rol
        )
        
        return Response({
            'detail': f'Usuario {email} agregado exitosamente al grupo',
            'usuario_id': usuario.usuario_id,
            'email': usuario.email,
            'nombre': usuario.nombre,
            'rol': rol
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='members/(?P<grupo_id>[^/.]+)')
    def list_members(self, request, grupo_id=None):
        """
        Listar todos los miembros de un grupo
        """
        try:
            grupo = models.Grupo.objects.get(grupo_id=grupo_id)
        except models.Grupo.DoesNotExist:
            raise ValidationError({'detail': 'El grupo no existe'})
        
        # Verificar que el usuario actual es miembro del grupo
        es_miembro = models.UsuarioGrupo.objects.filter(
            usuario=request.user,
            grupo=grupo
        ).exists()
        
        if not es_miembro:
            raise ValidationError({'detail': 'No tienes permisos para ver los miembros de este grupo'})
        
        # Obtener todos los miembros
        miembros = models.UsuarioGrupo.objects.filter(grupo=grupo).select_related('usuario')
        
        # Obtener el ID del creador (si existe)
        creador_id = grupo.creador.usuario_id if grupo.creador else None
        
        data = [{
            'usuario_id': m.usuario.usuario_id,
            'email': m.usuario.email,
            'nombre': m.usuario.nombre,
            'rol': m.rol,
            'es_creador': m.usuario.usuario_id == creador_id if creador_id else False
        } for m in miembros]
        
        return Response(data)

    @action(detail=False, methods=['post'], url_path='change-role')
    def change_role(self, request):
        """
        Cambiar el rol de un miembro en un grupo.
        Solo los administradores pueden cambiar roles.
        Requiere: usuario_id, grupo_id, nuevo_rol
        """
        usuario_id = request.data.get('usuario_id')
        grupo_id = request.data.get('grupo_id') or request.data.get('grupoId')
        nuevo_rol = request.data.get('nuevo_rol') or request.data.get('nuevoRol')
        
        if not usuario_id:
            raise ValidationError({'detail': 'El usuario_id es requerido'})
        if not grupo_id:
            raise ValidationError({'detail': 'El grupo_id es requerido'})
        if not nuevo_rol or nuevo_rol not in ['admin', 'miembro']:
            raise ValidationError({'detail': 'El nuevo_rol debe ser "admin" o "miembro"'})
        
        # Verificar que el grupo existe
        try:
            grupo = models.Grupo.objects.get(grupo_id=grupo_id)
        except models.Grupo.DoesNotExist:
            raise ValidationError({'detail': 'El grupo no existe'})
        
        # Verificar que el usuario actual es admin del grupo
        user_grupo = models.UsuarioGrupo.objects.filter(
            usuario=request.user,
            grupo=grupo,
            rol='admin'
        ).first()
        
        if not user_grupo:
            raise ValidationError({'detail': 'Solo los administradores del grupo pueden cambiar roles'})
        
        # Buscar el miembro a modificar
        try:
            usuario_a_modificar = models.Usuario.objects.get(usuario_id=usuario_id)
        except models.Usuario.DoesNotExist:
            raise ValidationError({'detail': 'El usuario no existe'})
        
        # PROTECCIÓN: No permitir cambiar el rol del creador del grupo
        if grupo.creador and grupo.creador.usuario_id == usuario_a_modificar.usuario_id:
            raise ValidationError({'detail': 'No se puede cambiar el rol del creador del grupo. El creador siempre debe ser administrador.'})
        
        # Buscar la relación usuario-grupo
        miembro_grupo = models.UsuarioGrupo.objects.filter(
            usuario=usuario_a_modificar,
            grupo=grupo
        ).first()
        
        if not miembro_grupo:
            raise ValidationError({'detail': 'El usuario no es miembro de este grupo'})
        
        # Si se está degradando a miembro, verificar que no sea el último admin
        if nuevo_rol == 'miembro' and miembro_grupo.rol == 'admin':
            admins_count = models.UsuarioGrupo.objects.filter(
                grupo=grupo,
                rol='admin'
            ).count()
            
            if admins_count <= 1:
                raise ValidationError({'detail': 'No se puede degradar al único administrador del grupo'})
        
        # Actualizar el rol
        rol_anterior = miembro_grupo.rol
        miembro_grupo.rol = nuevo_rol
        miembro_grupo.save()
        
        return Response({
            'detail': f'Rol cambiado de {rol_anterior} a {nuevo_rol} exitosamente',
            'usuario_id': usuario_a_modificar.usuario_id,
            'email': usuario_a_modificar.email,
            'nombre': usuario_a_modificar.nombre,
            'rol_anterior': rol_anterior,
            'rol_nuevo': nuevo_rol
        }, status=status.HTTP_200_OK)


class AportacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar aportaciones de usuarios a grupos.
    Al crear una aportación, se crea automáticamente:
    - Un egreso del bolsillo personal del usuario
    - Un ingreso al bolsillo del grupo
    """
    queryset = models.Aportacion.objects.all()
    serializer_class = serializers.AportacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return models.Aportacion.objects.none()
        
        # Mostrar aportaciones donde el usuario es el aportante o miembro del grupo
        grupos_ids = models.UsuarioGrupo.objects.filter(usuario=user).values_list('grupo', flat=True)
        return models.Aportacion.objects.filter(
            Q(usuario=user) | Q(grupo__in=grupos_ids)
        )

    @action(detail=False, methods=['post'], url_path='aportar')
    def aportar(self, request):
        """
        Endpoint para que un usuario aporte dinero a un grupo.
        Requiere: grupo_id, bolsillo_usuario_id, bolsillo_grupo_id, monto, fecha, descripcion (opcional)
        """
        user = request.user
        grupo_id = request.data.get('grupo_id')
        bolsillo_usuario_id = request.data.get('bolsillo_usuario_id')
        bolsillo_grupo_id = request.data.get('bolsillo_grupo_id')
        monto = request.data.get('monto')
        fecha = request.data.get('fecha')
        descripcion = request.data.get('descripcion', '')
        
        # Validaciones
        if not grupo_id:
            raise ValidationError({'detail': 'El grupo_id es requerido'})
        if not bolsillo_usuario_id:
            raise ValidationError({'detail': 'El bolsillo_usuario_id es requerido'})
        if not bolsillo_grupo_id:
            raise ValidationError({'detail': 'El bolsillo_grupo_id es requerido'})
        if not monto:
            raise ValidationError({'detail': 'El monto es requerido'})
        if not fecha:
            raise ValidationError({'detail': 'La fecha es requerida'})
        
        from decimal import Decimal
        
        try:
            monto = Decimal(str(monto))
            if monto <= 0:
                raise ValidationError({'detail': 'El monto debe ser mayor a 0'})
        except (ValueError, TypeError):
            raise ValidationError({'detail': 'El monto debe ser un número válido'})
        
        # Verificar que el grupo existe
        try:
            grupo = models.Grupo.objects.get(grupo_id=grupo_id)
        except models.Grupo.DoesNotExist:
            raise ValidationError({'detail': 'El grupo no existe'})
        
        # Verificar que el usuario es miembro del grupo
        es_miembro = models.UsuarioGrupo.objects.filter(
            usuario=user,
            grupo=grupo
        ).exists()
        if not es_miembro:
            raise ValidationError({'detail': 'No eres miembro de este grupo'})
        
        # Verificar que los bolsillos existen y pertenecen a quien deben
        try:
            bolsillo_usuario = models.Bolsillo.objects.get(
                bolsillo_id=bolsillo_usuario_id,
                usuario=user
            )
        except models.Bolsillo.DoesNotExist:
            raise ValidationError({'detail': 'El bolsillo de usuario no existe o no te pertenece'})
        
        try:
            bolsillo_grupo = models.Bolsillo.objects.get(
                bolsillo_id=bolsillo_grupo_id,
                grupo=grupo
            )
        except models.Bolsillo.DoesNotExist:
            raise ValidationError({'detail': 'El bolsillo del grupo no existe o no pertenece al grupo'})
        
        # Verificar saldo suficiente
        if bolsillo_usuario.saldo < monto:
            raise ValidationError({
                'detail': f'Saldo insuficiente. Tienes ${bolsillo_usuario.saldo}, necesitas ${monto}'
            })
        
        # Crear el egreso del usuario
        egreso = models.Egreso.objects.create(
            usuario=user,
            bolsillo=bolsillo_usuario,
            monto=monto,
            fecha=fecha,
            descripcion=descripcion or f'Aportación al grupo {grupo.nombre}',
            creado_por=user
        )
        
        # Actualizar saldo del bolsillo del usuario
        bolsillo_usuario.saldo -= monto
        bolsillo_usuario.save()
        
        # Crear el ingreso al grupo
        ingreso = models.Ingreso.objects.create(
            grupo=grupo,
            bolsillo=bolsillo_grupo,
            monto=monto,
            fecha=fecha,
            descripcion=descripcion or f'Aportación de {user.nombre or user.email}',
            creado_por=user
        )
        
        # Actualizar saldo del bolsillo del grupo
        bolsillo_grupo.saldo += monto
        bolsillo_grupo.save()
        
        # Crear el registro de aportación
        aportacion = models.Aportacion.objects.create(
            usuario=user,
            grupo=grupo,
            monto=monto,
            fecha=fecha,
            descripcion=descripcion,
            egreso_usuario=egreso,
            ingreso_grupo=ingreso,
            bolsillo_usuario=bolsillo_usuario,
            bolsillo_grupo=bolsillo_grupo
        )
        
        return Response({
            'detail': f'Aportación de ${monto} realizada exitosamente',
            'aportacion_id': aportacion.aportacion_id,
            'egreso_id': egreso.egreso_id,
            'ingreso_id': ingreso.ingreso_id,
            'nuevo_saldo_usuario': str(bolsillo_usuario.saldo),
            'nuevo_saldo_grupo': str(bolsillo_grupo.saldo)
        }, status=status.HTTP_201_CREATED)
