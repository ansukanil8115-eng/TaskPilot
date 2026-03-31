from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0003_task_submission_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="submission_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="task",
            name="submitted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
