#!/bin/sh
# 生成本机自签名 HTTPS 证书（含局域网 IP），供司机端手机定位使用。用法：sh tools/make-cert.sh
cd "$(dirname "$0")/.." || exit 1
mkdir -p certs
SAN="DNS:localhost,IP:127.0.0.1"
for ip in $(ifconfig 2>/dev/null | awk '/inet /{print $2}' | grep -v '^127\.'); do SAN="$SAN,IP:$ip"; done
openssl req -x509 -newkey rsa:2048 -nodes -days 365 -sha256 \
  -keyout certs/key.pem -out certs/cert.pem -subj "/CN=qixia-local" -addext "subjectAltName=$SAN" 2>/dev/null \
  && echo "已生成 certs/cert.pem（${SAN}）。重启 node server.mjs 后，司机端用终端里打印的 https 地址打开。"
