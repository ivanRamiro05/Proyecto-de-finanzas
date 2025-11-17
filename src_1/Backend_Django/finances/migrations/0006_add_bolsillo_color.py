from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finances", "0005_merge_20251105_2020"),
    ]

    operations = [
        migrations.AddField(
            model_name="bolsillo",
            name="color",
            field=models.CharField(default="#ef4444", max_length=7),
        ),
    ]
