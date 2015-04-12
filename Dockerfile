FROM python:2-onbuild

CMD ["python", "./estimation.py"]

EXPOSE 8888
