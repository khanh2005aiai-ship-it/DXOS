FROM golang:1.27.2-alpine AS build
RUN apk add --no-cache git ca-certificates
RUN go install github.com/caddyserver/xcaddy/cmd/xcaddy@v0.4.5
RUN CGO_ENABLED=0 xcaddy build v2.11.7 --output /usr/bin/caddy \
    --with github.com/corazawaf/coraza-caddy/v2@v2.6.2 \
    --replace golang.org/x/net=golang.org/x/net@v0.60.0
FROM ghcr.io/coreruleset/coraza-crs@sha256:627229dd936934d773cf1a8de77ec9ae89d547b1a891e6da3b46b0282bb694cc
USER root
RUN apk upgrade --no-cache
COPY --from=build /usr/bin/caddy /usr/bin/caddy
USER 1000:1000
