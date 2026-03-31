from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0002_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="task",
            name="status",
            field=models.CharField(
                choices=[
                    ("TODO", "To Do"),
                    ("IN_PROGRESS", "In Progress"),
                    ("SUBMITTED", "Submitted"),
                    ("DONE", "Done"),
                ],
                default="TODO",
                max_length=20,
            ),
        ),
    ]
