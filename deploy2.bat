@echo off
set PATH=%PATH%;C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin;C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin;%LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk\bin
echo Deploying to Google Cloud Run... > deploy_log.txt
gcloud run deploy ai-promptwars-veer --source . --project ai-promptwars --region us-central1 --allow-unauthenticated --quiet >> deploy_log.txt 2>&1
echo Done deployment. >> deploy_log.txt
