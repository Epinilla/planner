# -*- coding: utf-8 -*-
# Generated by Django 1.9.8 on 2016-08-07 19:44
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0003_auto_20160807_0607'),
    ]

    operations = [
        migrations.AlterField(
            model_name='coursesection',
            name='days',
            field=models.CharField(max_length=100),
        ),
    ]
