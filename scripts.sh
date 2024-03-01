
$ docker run -d --name jaeger \
>   -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
>   -p 5775:5775/udp \
>   -p 6831:6831/udp \
>   -p 6832:6832/udp \
>   -p 5778:5778 \
>   -p 16686:16686 \
>   -p 14268:14268 \
>   -p 14250:14250 \
>   -p 9411:9411 \
>   jaegertracing/all-in-one:latest

docker run -d --name jaeger -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 -p 5775:5775/udp -p 6831:6831/udp -p 6832:6832/udp -p 5778:5778 -p 16686:16686 -p 14268:14268 -p 14250:14250 jaegertracing/all-in-one:latest

docker run -d --name jaeger   -e COLLECTOR_ZIPKIN_HOST_PORT=:9411
http://localhost:16686/search

npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http

npm install @opentelemetry/exporter-jaeger

npm install --save @opentelemetry/instrumentation-mongodb