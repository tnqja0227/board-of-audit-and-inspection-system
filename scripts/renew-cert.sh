#!/bin/bash

function renew_cert {
    docker run --rm -it -v /etc/letsencrypt:/etc/letsencrypt -v /var/lib/letsencrypt:/var/lib/letsencrypt certbot/certbot renew -d '*.gdsckaist.com' --manual --preferred-challenges dns --email kyungho.byoun@gmail.com --agree-tos --no-eff-email
}

renew_cert