# -*- coding: utf-8 -*-
# Generated by Django 1.9.8 on 2016-08-13 20:30
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='review',
            old_name='reply_to',
            new_name='course',
        ),
    ]
