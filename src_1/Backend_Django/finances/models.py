from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    usuario_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, blank=True)
    email = models.EmailField(max_length=120, unique=True)
    DIVISA_CHOICES = [
        ("USD", "USD"), ("EUR", "EUR"), ("GBP", "GBP"), ("JPY", "JPY"), ("COP", "COP"),
    ]
    divisa_pref = models.CharField(max_length=3, choices=DIVISA_CHOICES, default="COP")

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "usuario"

    def __str__(self):
        return self.email


class Grupo(models.Model):
    grupo_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, db_index=True)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='grupos_creados')

    class Meta:
        db_table = "grupo"


class UsuarioGrupo(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE)
    ROL_CHOICES = [("admin", "admin"), ("miembro", "miembro")]
    rol = models.CharField(max_length=10, choices=ROL_CHOICES, default="miembro")

    class Meta:
        db_table = "usuario_grupo"
        unique_together = (("usuario", "grupo"),)


class Bolsillo(models.Model):
    bolsillo_id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    grupo = models.ForeignKey(Grupo, on_delete=models.SET_NULL, null=True, blank=True)
    nombre = models.CharField(max_length=100)
    saldo = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    # color para mostrar en UI (ej. #ef4444)
    color = models.CharField(max_length=7, default='#ef4444')

    class Meta:
        db_table = "bolsillo"
        constraints = [
            models.CheckConstraint(check=(models.Q(usuario__isnull=True) ^ models.Q(grupo__isnull=True)), name="chk_bolsillo_owner"),
            models.UniqueConstraint(fields=["usuario", "nombre"], name="uk_bolsillo_usuario_nombre"),
            models.UniqueConstraint(fields=["grupo", "nombre"], name="uk_bolsillo_grupo_nombre"),
        ]


class Categoria(models.Model):
    categoria_id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    grupo = models.ForeignKey(Grupo, on_delete=models.SET_NULL, null=True, blank=True)
    nombre = models.CharField(max_length=100)
    # color para mostrar en UI (ej. #ef4444)
    color = models.CharField(max_length=7, default='#ef4444')
    TIPO_CHOICES = [("ing", "ing"), ("eg", "eg")]
    tipo = models.CharField(max_length=3, choices=TIPO_CHOICES)

    class Meta:
        db_table = "categoria"
        constraints = [
            models.CheckConstraint(check=(models.Q(usuario__isnull=True) ^ models.Q(grupo__isnull=True)), name="chk_categoria_owner"),
            models.UniqueConstraint(fields=["usuario", "nombre", "tipo"], name="uk_cat_u_nombre_tipo"),
            models.UniqueConstraint(fields=["grupo", "nombre", "tipo"], name="uk_cat_g_nombre_tipo"),
        ]


class Transferencia(models.Model):
    transferencia_id = models.AutoField(primary_key=True)
    de_bolsillo = models.ForeignKey(Bolsillo, related_name="transferencias_origen", on_delete=models.RESTRICT)
    a_bolsillo = models.ForeignKey(Bolsillo, related_name="transferencias_destino", on_delete=models.RESTRICT)
    monto_origen = models.DecimalField(max_digits=14, decimal_places=2)
    monto_destino = models.DecimalField(max_digits=14, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT)

    class Meta:
        db_table = "transferencia"
        constraints = [
            models.CheckConstraint(check=~models.Q(de_bolsillo=models.F('a_bolsillo')), name="chk_transferencia_bolsillos_diff"),
            models.CheckConstraint(check=(models.Q(monto_origen__gt=0) & models.Q(monto_destino__gt=0)), name="chk_transferencia_montos_pos"),
        ]


class Ingreso(models.Model):
    ingreso_id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    grupo = models.ForeignKey(Grupo, on_delete=models.SET_NULL, null=True, blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    bolsillo = models.ForeignKey(Bolsillo, on_delete=models.SET_NULL, null=True, blank=True)
    transferencia = models.ForeignKey(Transferencia, on_delete=models.SET_NULL, null=True, blank=True)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    fecha = models.DateField()
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='ingresos_creados')

    class Meta:
        db_table = "ingreso"
        constraints = [
            models.CheckConstraint(check=(models.Q(usuario__isnull=True) ^ models.Q(grupo__isnull=True)), name="chk_ingreso_owner"),
            models.CheckConstraint(check=models.Q(monto__gt=0), name="chk_ingreso_monto"),
        ]


class Egreso(models.Model):
    egreso_id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    grupo = models.ForeignKey(Grupo, on_delete=models.SET_NULL, null=True, blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    bolsillo = models.ForeignKey(Bolsillo, on_delete=models.SET_NULL, null=True, blank=True)
    transferencia = models.ForeignKey(Transferencia, on_delete=models.SET_NULL, null=True, blank=True)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    fecha = models.DateField()
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='egresos_creados')

    class Meta:
        db_table = "egreso"
        constraints = [
            models.CheckConstraint(check=(models.Q(usuario__isnull=True) ^ models.Q(grupo__isnull=True)), name="chk_egreso_owner"),
            models.CheckConstraint(check=models.Q(monto__gt=0), name="chk_egreso_monto"),
        ]


class Movimiento(models.Model):
    movimiento_id = models.AutoField(primary_key=True)
    TIPO_CHOICES = [("ing", "ing"), ("eg", "eg")]
    tipo = models.CharField(max_length=3, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=15, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    grupo = models.ForeignKey(Grupo, on_delete=models.SET_NULL, null=True, blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    bolsillo = models.ForeignKey(Bolsillo, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = "movimiento"
        constraints = [
            models.CheckConstraint(check=(models.Q(usuario__isnull=True) ^ models.Q(grupo__isnull=True)), name="chk_movimiento_owner"),
            models.CheckConstraint(check=models.Q(monto__gt=0), name="chk_movimiento_monto"),
        ]


class Aportacion(models.Model):
    """
    Modelo para registrar aportaciones de usuarios a grupos.
    Crea automáticamente un egreso del usuario y un ingreso al grupo.
    """
    aportacion_id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT)
    grupo = models.ForeignKey(Grupo, on_delete=models.RESTRICT)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    fecha = models.DateField()
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    
    # Referencias a las transacciones creadas
    egreso_usuario = models.ForeignKey(Egreso, on_delete=models.SET_NULL, null=True, blank=True, related_name='aportacion_egreso')
    ingreso_grupo = models.ForeignKey(Ingreso, on_delete=models.SET_NULL, null=True, blank=True, related_name='aportacion_ingreso')
    
    # Bolsillos involucrados
    bolsillo_usuario = models.ForeignKey(Bolsillo, on_delete=models.RESTRICT, related_name='aportaciones_origen')
    bolsillo_grupo = models.ForeignKey(Bolsillo, on_delete=models.RESTRICT, related_name='aportaciones_destino')
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "aportacion"
        constraints = [
            models.CheckConstraint(check=models.Q(monto__gt=0), name="chk_aportacion_monto"),
        ]
    
    def __str__(self):
        return f"{self.usuario.email} -> {self.grupo.nombre}: {self.monto}"

