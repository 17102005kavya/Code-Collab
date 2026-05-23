FROM node:20

# Install all language compilers for local execution
RUN apt-get update && \
    apt-get install -y \
    python3 \
    g++ \
    default-jdk \
    golang-go \
    rustc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

EXPOSE 4000

CMD ["node", "index.js"]
