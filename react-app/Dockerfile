# node.js 22 기반 공식 이미지 사용
FROM node:22-alpine AS build 

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 설치 (패키지 파일 복사)
# package.json과 package-lock.json 파일을 현재 작업 디렉토리(./)로 복사
COPY package.json package-lock.json ./

# npm을 사용하여 종속성을 설치합니다.
RUN npm ci

# 현재 디렉토리의 모든 파일을 Docker 이미지 내의 작업 디렉토리(WORKDIR)로 복사합니다.
#  두 번째 점(.)은 이미지 내의 현재 작업 디렉토리, 즉 WORKDIR로 지정된 위치를 의미
COPY . .

# 이미지 빌드 시 전달받을 변수 
ARG VITE_API_BASE_URL=/api

# ARG로 전달받은 값을 환경 변수로 설정
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# React 애플리케이션을 빌드
RUN npm run build

# Nginx를 사용하여 React 애플리케이션을 서빙하기 위한 런타임 이미지 생성
FROM nginx:1.28-alpine AS runtime

# Nginx 설정 파일을 컨테이너 내의 Nginx 설정 디렉토리로 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# React 애플리케이션 빌드 결과물을 Nginx의 기본 웹 루트 디렉토리로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx가 80번 포트에서 요청을 수신하도록 설정
EXPOSE 80

# Nginx를 포그라운드에서 실행하여 컨테이너가 종료되지 않도록 유지
CMD ["nginx", "-g", "daemon off;"]
