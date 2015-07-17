FROM python:3

VOLUME /var/estimationer

WORKDIR /var/estimationer

COPY statics /var/estimationer/statics
COPY templates /var/estimationer/templates
COPY estimation.py /var/estimationer/estimation.py
COPY requirements.txt /var/estimationer/requirements.txt

RUN pip install -r requirements.txt

ENTRYPOINT ["python"]
CMD ["estimation.py"]

EXPOSE 8888
