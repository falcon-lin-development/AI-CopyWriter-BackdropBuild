FROM public.ecr.aws/lambda/python:3.11

WORKDIR /var/task
# Get the lambda function directory
# Set the lambda function directory
# ENV LAMBDA_FUNCTION_DIR=${LAMBDA_FUNCTION_DIR}

# Copy the requirements file and install dependencies
COPY ./requirements.txt ./
RUN pip install  -r requirements.txt
# RUN pip install --no-cache-dir -r requirements.txt

# Copy the common utilities and shared modules
# COPY ./common /opt/python

# Copy the specific lambda function files
ARG LAMBDA_FUNCTION_DIR
COPY ${LAMBDA_FUNCTION_DIR}/ .

CMD [ "app.handler" ]