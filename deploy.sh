#!/bin/bash
cd ~
git pull origin main
docker compose down
docker compose up -d --build
