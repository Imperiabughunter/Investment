# This file makes the tasks directory a Python package
# Import tasks to make them available for Celery worker
from tasks.investment_tasks import *
from tasks.loan_tasks import *
from tasks.crypto_tasks import *
from tasks.notification_tasks import *