FROM nginx:1.27-alpine

# Serve the HTML5 game as static files.
WORKDIR /usr/share/nginx/html

COPY . /usr/share/nginx/html/

EXPOSE 80
