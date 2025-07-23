FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && \
    apt-get install -y \
        software-properties-common \
        ca-certificates \
        curl \
        gnupg \
        lsb-release && \
    # Add Ondřej Surý's PHP repository for PHP 8.2
    add-apt-repository ppa:ondrej/php -y && \
    # Add Node.js 22.x repository
    curl -sL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get update && \
    apt-get install -y \
        openjdk-21-jdk \
        git \
        curl \
        sshpass \
        php8.2 \
        php8.2-cli \
        php8.2-mbstring \
        php8.2-xml \
        php8.2-zip \
        php8.2-sqlite3 \
        sqlite3 \
	nodejs \
        openssh-server \
        rsync \
        nano \
        jq && \
    # Install Composer manually
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer && \
    # Clean up
    apt-get -y autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /var/run/sshd

# Create jenkins user
RUN useradd -m jenkins -s /bin/bash

EXPOSE 22

CMD ["/usr/sbin/sshd", "-D"]
