from django.db import migrations


create_view_sql = """
CREATE VIEW IF NOT EXISTS v_movimientos AS
SELECT
  i.ingreso_id AS id, 'ing' AS tipo, i.monto AS monto,
  CAST(i.fecha AS DATETIME) AS fecha, i.descripcion,
  i.usuario_id, i.grupo_id, i.categoria_id, i.bolsillo_id
FROM ingreso i
UNION ALL
SELECT
  e.egreso_id AS id, 'eg' AS tipo, -e.monto AS monto,
  CAST(e.fecha AS DATETIME) AS fecha, e.descripcion,
  e.usuario_id, e.grupo_id, e.categoria_id, e.bolsillo_id
FROM egreso e;
"""

drop_view_sql = """
DROP VIEW IF EXISTS v_movimientos;
"""


class Migration(migrations.Migration):

    dependencies = [
        ('finances', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(create_view_sql, reverse_sql=drop_view_sql),
    ]
