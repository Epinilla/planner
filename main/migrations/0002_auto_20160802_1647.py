# -*- coding: utf-8 -*-
# Generated by Django 1.9.8 on 2016-08-02 16:47
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='course',
            name='instructors',
        ),
        migrations.AlterField(
            model_name='courseschedule',
            name='days',
            field=models.CharField(max_length=100),
        ),
    ]
