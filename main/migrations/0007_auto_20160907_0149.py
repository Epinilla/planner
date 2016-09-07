# -*- coding: utf-8 -*-
# Generated by Django 1.9.8 on 2016-09-07 01:49
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('main', '0006_course_average_rating'),
    ]

    operations = [
        migrations.CreateModel(
            name='PlanYear',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.CharField(max_length=10)),
                ('autumn', models.ManyToManyField(related_name='plans_autumn', to='main.Course')),
            ],
        ),
        migrations.RemoveField(
            model_name='planquarter',
            name='courses',
        ),
        migrations.RemoveField(
            model_name='planquarter',
            name='plan',
        ),
        migrations.AlterField(
            model_name='plan',
            name='student',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plans', to=settings.AUTH_USER_MODEL),
        ),
        migrations.DeleteModel(
            name='PlanQuarter',
        ),
        migrations.AddField(
            model_name='planyear',
            name='plan',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='years', to='main.Plan'),
        ),
        migrations.AddField(
            model_name='planyear',
            name='spring',
            field=models.ManyToManyField(related_name='plans_spring', to='main.Course'),
        ),
        migrations.AddField(
            model_name='planyear',
            name='student',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plan_years', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='planyear',
            name='summer',
            field=models.ManyToManyField(related_name='plans_summer', to='main.Course'),
        ),
        migrations.AddField(
            model_name='planyear',
            name='winter',
            field=models.ManyToManyField(related_name='plans_winter', to='main.Course'),
        ),
    ]
