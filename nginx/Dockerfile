# ═══════════════════════════════════════════════════════════════
# shenjiying88 — Nginx Docker 镜像
# ═══════════════════════════════════════════════════════════════

FROM docker.m.daocloud.io/library/nginx:1.27-alpine

# 删除默认配置
RUN rm -f /etc/nginx/conf.d/default.conf

# 复制自定义配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
