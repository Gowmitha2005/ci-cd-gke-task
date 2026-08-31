FROM jenkins/jenkins:lts-jdk21

USER root

RUN apt-get update \
    && apt-get install -y docker.io curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && usermod -aG root jenkins \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER jenkins