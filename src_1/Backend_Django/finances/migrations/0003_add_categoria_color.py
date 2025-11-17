from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finances', '0002_create_view_v_movimientos'),
    ]

    operations = [
        migrations.AddField(
            model_name='categoria',
            name='color',
            field=models.CharField(default='#ef4444', max_length=7),
        ),
    ]
