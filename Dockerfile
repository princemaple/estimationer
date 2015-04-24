FROM python:3-onbuild

CMD ["python", "./estimation.py"]

EXPOSE 8888
