"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from finances import views as finances_views
from rest_framework.authtoken import views as drf_authtoken_views

router = routers.DefaultRouter()
router.register(r'usuarios', finances_views.UsuarioViewSet)
router.register(r'grupos', finances_views.GrupoViewSet)
router.register(r'bolsillos', finances_views.BolsilloViewSet)
router.register(r'categorias', finances_views.CategoriaViewSet)
router.register(r'transferencias', finances_views.TransferenciaViewSet)
router.register(r'ingresos', finances_views.IngresoViewSet)
router.register(r'egresos', finances_views.EgresoViewSet)
router.register(r'movimientos', finances_views.MovimientoViewSet)
router.register(r'usuario-grupo', finances_views.UsuarioGrupoViewSet)
router.register(r'aportaciones', finances_views.AportacionViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-token-auth/', drf_authtoken_views.obtain_auth_token, name='api_token_auth'),
        path('api/register/', finances_views.RegisterAPIView.as_view(), name='api_register'),
]
