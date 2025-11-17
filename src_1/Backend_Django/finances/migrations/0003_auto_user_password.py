# Generated manually to set default password value for existing Usuario rows
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finances', '0002_create_view_v_movimientos'),
    ]

    operations = [
        # Add Django's default password field with default '' to avoid interactive prompt
        migrations.AddField(
            model_name='usuario',
            name='password',
            field=models.CharField(default='', max_length=128),
            preserve_default=False,
        ),
        # Add fields required by AbstractBaseUser/PermissionsMixin
        migrations.AddField(
            model_name='usuario',
            name='is_staff',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='usuario',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='usuario',
            name='date_joined',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        # Remove old password_hash column if present to avoid duplication
        migrations.RemoveField(
            model_name='usuario',
            name='password_hash',
        ),
    ]
