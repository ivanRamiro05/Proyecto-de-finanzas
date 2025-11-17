from django.contrib import admin
from . import models

admin.site.register(models.Usuario)
admin.site.register(models.Grupo)
admin.site.register(models.Bolsillo)
admin.site.register(models.Categoria)
admin.site.register(models.Transferencia)
admin.site.register(models.Ingreso)
admin.site.register(models.Egreso)
admin.site.register(models.Movimiento)
