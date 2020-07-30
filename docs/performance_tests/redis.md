- [Redis](#redis)
- [Local: Benchmark code hits local redis](#local-benchmark-code-hits-local-redis)
  - [General tests on i3.xlarge](#general-tests-on-i3xlarge)
  - [75M requests of SET (around 25 minutes)](#75m-requests-of-set-around-25-minutes)
    - [i3.xlarge with SSD mounted](#i3xlarge-with-ssd-mounted)
    - [i3.xlarge without SSD mounted (so EBS filesystem)](#i3xlarge-without-ssd-mounted-so-ebs-filesystem)
- [Network: Benchmark code hits remote redis](#network-benchmark-code-hits-remote-redis)
  - [i3.xlarge hitting another i3.xlarge with SSD mounted](#i3xlarge-hitting-another-i3xlarge-with-ssd-mounted)
- [Single client (parallellism off)](#single-client-parallellism-off)
  - [Single client: Network vs local](#single-client-network-vs-local)
    - [Single client: Redis by Network (i3.xlarge)](#single-client-redis-by-network-i3xlarge)
    - [Single client: Redis by local (i3.xlarge)](#single-client-redis-by-local-i3xlarge)

# Redis

Running tests according to https://redis.io/topics/benchmarks
- default tests do 3 bytes of data
- those benchmarks run the code of https://github.com/redis/redis/blob/unstable/src/redis-benchmark.c

# Local: Benchmark code hits local redis
"local redis" means that the benchmark script is inside of the same docker the Redis server resides.

## General tests on i3.xlarge

- 1 [Redis i3.xlarge](runs/redis-benchmark_local_i3.xlarge_everysec_persisted.md) - filesystem on EBS - persistence: everysec
- 2 [Redis i3.xlarge](runs/redis-benchmark_local_i3.xlarge_everysec_persisted_ssd.md) - filesystem on SSD - persistence: everysec

- 3 [Redis i3.xlarge](runs/redis-benchmark_local_i3.xlarge_always_persisted.md) - filesystem on EBS - persistence: always
- 4 [Redis i3.xlarge](runs/redis-benchmark_local_i3.xlarge_always_persisted_ssd.md) - filesystem on SSD - persistence: always

| | 1 | 2 | 3 | 4  |
| --- | --- | --- | --- | --- |
| | EBS | SSD | EBS | SSD |
| | everysec | everysec | always | always |
| Test # | req/s | req/s | req/s | req/s |
| 1 Default benchmark PING (100k requests) | 82850 | 58858 | 79681 | 63897 |
| 1 Default benchmark SET (100k requests) | 77821 | 66844 | 15812 | 48614 |
| 1 Default benchmark GET (100k requests) | 79239 | 62617 | 83194 | 67659 |
| 2 1M requests (default) PING | 81906 | 62046 | 82331 | 64632 |
| 2 1M requests (default) SET | 83465 | 67249 | 15918 | 49667 |
| 2 1M requests (default) GET | 81473 | 62433 | 82169 | 62680 |
| 3 SET (1M) | 83738 | 66085 | 15906 | 51332 |
| 4 SET with random key | 81419 | 65500 | 15970 | 49084 |
| 5 SET through LUA script (vs run #3 - no significant diff) | 83263 | 67145 | 14869 | 49275 |
| 6 SET (LUA) with participant-like key and 30 bytes data | 80534 | 64884 | 14972 | 47272 |
| 7 SET (LUA) with participant-like key and 300 bytes data | 76283 | 64094 | 14249 | 44800 |
| 8 SET (LUA) with participant-like key and 300 bytes data | 23822 | 33308 | 9774 | 25445 |
| 9 SET with random key and 3000 bytes data | 42879 | 45228 | 30296 | 30296 |

Comment: When testing "everysec" scenario, the EBS provisioned machine reports better results than SSD one. This looks strange, so to re-check, we provisioned new i3.xlarge machine, did the SET (1M) test, then switched that machine to SSD and did the SET (1M) again. This confirmed those results displayed in the table above (so it's not a straightforward error/mistake and data is valid). We didn't investigate that further yet, but that needs some more understanding probably.

## 75M requests of SET (around 25 minutes)

```
redis-benchmark -t set -n 75000000
```
### i3.xlarge with SSD mounted
```
$ redis-benchmark -t set -n 75000000
====== SET ======
  75000000 requests completed in 1461.30 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.00% <= 0.3 milliseconds
0.01% <= 0.4 milliseconds
0.21% <= 0.5 milliseconds
1.56% <= 0.6 milliseconds
20.75% <= 0.7 milliseconds
44.15% <= 0.8 milliseconds
62.52% <= 0.9 milliseconds
78.52% <= 1.0 milliseconds
90.32% <= 1.1 milliseconds
94.86% <= 1.2 milliseconds
96.86% <= 1.3 milliseconds
98.39% <= 1.4 milliseconds
98.90% <= 1.5 milliseconds
99.08% <= 1.6 milliseconds
99.19% <= 1.7 milliseconds
99.26% <= 1.8 milliseconds
99.33% <= 1.9 milliseconds
99.40% <= 2 milliseconds
99.93% <= 3 milliseconds
99.97% <= 4 milliseconds
99.98% <= 5 milliseconds
99.98% <= 6 milliseconds
99.99% <= 7 milliseconds
99.99% <= 8 milliseconds
99.99% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 11 milliseconds
100.00% <= 12 milliseconds
100.00% <= 13 milliseconds
100.00% <= 14 milliseconds
100.00% <= 15 milliseconds
100.00% <= 16 milliseconds
100.00% <= 19 milliseconds
100.00% <= 25 milliseconds
100.00% <= 26 milliseconds
100.00% <= 26 milliseconds
51324.20 requests per second
```
[![](runs/redis_long_set_local_i3.xlarge_always_persisted_ssd_grafana.jpg)](runs/redis_long_set_local_i3.xlarge_always_persisted_ssd_grafana.jpg)
### i3.xlarge without SSD mounted (so EBS filesystem)

```
redis-benchmark -t set -n 75000000
====== SET ======
  75000000 requests completed in 6911.88 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1.4 milliseconds
0.00% <= 1.5 milliseconds
0.00% <= 1.6 milliseconds
0.00% <= 1.7 milliseconds
0.41% <= 1.8 milliseconds
4.46% <= 1.9 milliseconds
12.44% <= 2 milliseconds
29.01% <= 3 milliseconds
82.30% <= 4 milliseconds
87.88% <= 5 milliseconds
88.51% <= 6 milliseconds
88.71% <= 7 milliseconds
88.82% <= 8 milliseconds
88.89% <= 9 milliseconds
89.10% <= 10 milliseconds
93.61% <= 11 milliseconds
93.64% <= 12 milliseconds
93.65% <= 13 milliseconds
93.67% <= 14 milliseconds
93.69% <= 15 milliseconds
93.70% <= 16 milliseconds
93.71% <= 17 milliseconds
93.72% <= 18 milliseconds
93.74% <= 19 milliseconds
99.65% <= 20 milliseconds
99.95% <= 21 milliseconds
99.96% <= 22 milliseconds
99.97% <= 23 milliseconds
99.98% <= 24 milliseconds
99.99% <= 25 milliseconds
99.99% <= 26 milliseconds
99.99% <= 27 milliseconds
99.99% <= 28 milliseconds
99.99% <= 29 milliseconds
99.99% <= 30 milliseconds
100.00% <= 31 milliseconds
100.00% <= 32 milliseconds
100.00% <= 33 milliseconds
100.00% <= 34 milliseconds
100.00% <= 35 milliseconds
100.00% <= 36 milliseconds
100.00% <= 37 milliseconds
100.00% <= 38 milliseconds
100.00% <= 39 milliseconds
100.00% <= 40 milliseconds
100.00% <= 41 milliseconds
100.00% <= 42 milliseconds
100.00% <= 43 milliseconds
100.00% <= 44 milliseconds
100.00% <= 45 milliseconds
100.00% <= 46 milliseconds
100.00% <= 49 milliseconds
100.00% <= 50 milliseconds
100.00% <= 51 milliseconds
100.00% <= 52 milliseconds
100.00% <= 53 milliseconds
100.00% <= 56 milliseconds
100.00% <= 59 milliseconds
100.00% <= 60 milliseconds
100.00% <= 62 milliseconds
100.00% <= 63 milliseconds
100.00% <= 66 milliseconds
100.00% <= 66 milliseconds
10850.88 requests per second
```
[![](runs/redis_long_set_local_i3.xlarge_always_persisted_ebs_grafana.jpg)](runs/redis_long_set_local_i3.xlarge_always_persisted_ebs_grafana.jpg)

# Network: Benchmark code hits remote redis

## i3.xlarge hitting another i3.xlarge with SSD mounted

Test `redis-benchmark` runs on i3.xlarge (inside of redis container) and hits redis (through network) hosted on another i3.xlarge machine:
```
redis-benchmark -h 10.42.144.10 -t set -n 75000000
====== SET ======
  75000000 requests completed in 2642.50 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.4 milliseconds
0.00% <= 0.5 milliseconds
0.02% <= 0.6 milliseconds
0.23% <= 0.7 milliseconds
0.89% <= 0.8 milliseconds
2.24% <= 0.9 milliseconds
4.72% <= 1.0 milliseconds
8.70% <= 1.1 milliseconds
14.78% <= 1.2 milliseconds
22.92% <= 1.3 milliseconds
32.22% <= 1.4 milliseconds
42.13% <= 1.5 milliseconds
52.75% <= 1.6 milliseconds
64.28% <= 1.7 milliseconds
75.15% <= 1.8 milliseconds
83.17% <= 1.9 milliseconds
88.05% <= 2 milliseconds
99.72% <= 3 milliseconds
99.86% <= 4 milliseconds
99.90% <= 5 milliseconds
99.92% <= 6 milliseconds
99.93% <= 7 milliseconds
99.95% <= 8 milliseconds
99.96% <= 9 milliseconds
99.97% <= 10 milliseconds
99.97% <= 11 milliseconds
99.98% <= 12 milliseconds
99.98% <= 13 milliseconds
99.98% <= 14 milliseconds
99.98% <= 15 milliseconds
99.98% <= 16 milliseconds
99.98% <= 17 milliseconds
99.98% <= 18 milliseconds
99.99% <= 19 milliseconds
99.99% <= 20 milliseconds
99.99% <= 21 milliseconds
99.99% <= 22 milliseconds
99.99% <= 23 milliseconds
99.99% <= 24 milliseconds
99.99% <= 25 milliseconds
99.99% <= 26 milliseconds
99.99% <= 27 milliseconds
99.99% <= 28 milliseconds
99.99% <= 29 milliseconds
99.99% <= 30 milliseconds
99.99% <= 31 milliseconds
99.99% <= 32 milliseconds
99.99% <= 33 milliseconds
99.99% <= 34 milliseconds
99.99% <= 35 milliseconds
99.99% <= 36 milliseconds
99.99% <= 37 milliseconds
99.99% <= 38 milliseconds
99.99% <= 39 milliseconds
99.99% <= 40 milliseconds
99.99% <= 41 milliseconds
99.99% <= 42 milliseconds
99.99% <= 43 milliseconds
99.99% <= 44 milliseconds
99.99% <= 45 milliseconds
99.99% <= 46 milliseconds
99.99% <= 47 milliseconds
99.99% <= 48 milliseconds
99.99% <= 49 milliseconds
99.99% <= 50 milliseconds
99.99% <= 51 milliseconds
99.99% <= 52 milliseconds
99.99% <= 53 milliseconds
99.99% <= 54 milliseconds
100.00% <= 55 milliseconds
100.00% <= 56 milliseconds
100.00% <= 57 milliseconds
100.00% <= 58 milliseconds
100.00% <= 59 milliseconds
100.00% <= 60 milliseconds
100.00% <= 61 milliseconds
100.00% <= 62 milliseconds
100.00% <= 63 milliseconds
100.00% <= 64 milliseconds
100.00% <= 65 milliseconds
100.00% <= 66 milliseconds
100.00% <= 67 milliseconds
100.00% <= 68 milliseconds
100.00% <= 69 milliseconds
100.00% <= 70 milliseconds
100.00% <= 71 milliseconds
100.00% <= 72 milliseconds
100.00% <= 73 milliseconds
100.00% <= 74 milliseconds
100.00% <= 75 milliseconds
100.00% <= 76 milliseconds
100.00% <= 77 milliseconds
100.00% <= 78 milliseconds
100.00% <= 79 milliseconds
100.00% <= 80 milliseconds
100.00% <= 81 milliseconds
100.00% <= 82 milliseconds
100.00% <= 83 milliseconds
100.00% <= 84 milliseconds
100.00% <= 85 milliseconds
100.00% <= 86 milliseconds
100.00% <= 87 milliseconds
100.00% <= 88 milliseconds
100.00% <= 89 milliseconds
100.00% <= 90 milliseconds
100.00% <= 91 milliseconds
28382.21 requests per second
```

[![](runs/redis_long_set_network_i3.xlarge_always_persisted_ssd_grafana.jpg)](runs/redis_long_set_network_i3.xlarge_always_persisted_ssd_grafana.jpg)


# Single client (parallellism off)

## Single client: Network vs local
### Single client: Redis by Network (i3.xlarge)
redis-benchmark on i3.xlarge hits redis on i3.xlarge with SSD mounted

```
redis-benchmark -h 10.42.144.10 -t set -n 3000000 -c 1
====== SET ======
  3000000 requests completed in 1182.69 seconds
  1 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.3 milliseconds
87.23% <= 0.4 milliseconds
99.06% <= 0.5 milliseconds
99.52% <= 0.6 milliseconds
99.63% <= 0.7 milliseconds
99.68% <= 0.8 milliseconds
99.71% <= 0.9 milliseconds
99.75% <= 1.0 milliseconds
99.79% <= 1.1 milliseconds
99.83% <= 1.2 milliseconds
99.86% <= 1.3 milliseconds
99.87% <= 1.4 milliseconds
99.89% <= 1.5 milliseconds
99.89% <= 1.6 milliseconds
99.90% <= 1.7 milliseconds
99.91% <= 1.8 milliseconds
99.91% <= 1.9 milliseconds
99.92% <= 2 milliseconds
99.94% <= 3 milliseconds
99.95% <= 4 milliseconds
99.96% <= 5 milliseconds
99.97% <= 6 milliseconds
99.97% <= 7 milliseconds
99.97% <= 8 milliseconds
99.98% <= 9 milliseconds
99.98% <= 10 milliseconds
99.98% <= 11 milliseconds
99.98% <= 12 milliseconds
99.98% <= 13 milliseconds
99.98% <= 14 milliseconds
99.98% <= 15 milliseconds
99.98% <= 16 milliseconds
99.98% <= 17 milliseconds
99.99% <= 18 milliseconds
99.99% <= 19 milliseconds
99.99% <= 20 milliseconds
99.99% <= 21 milliseconds
99.99% <= 22 milliseconds
99.99% <= 23 milliseconds
99.99% <= 24 milliseconds
99.99% <= 25 milliseconds
99.99% <= 26 milliseconds
99.99% <= 27 milliseconds
99.99% <= 28 milliseconds
99.99% <= 29 milliseconds
99.99% <= 30 milliseconds
99.99% <= 31 milliseconds
99.99% <= 32 milliseconds
99.99% <= 33 milliseconds
99.99% <= 34 milliseconds
100.00% <= 35 milliseconds
100.00% <= 36 milliseconds
100.00% <= 37 milliseconds
100.00% <= 38 milliseconds
100.00% <= 39 milliseconds
100.00% <= 40 milliseconds
100.00% <= 41 milliseconds
100.00% <= 42 milliseconds
100.00% <= 43 milliseconds
100.00% <= 44 milliseconds
100.00% <= 46 milliseconds
100.00% <= 47 milliseconds
2536.59 requests per second
```

[![](runs/redis_long_set_network_single_client_i3.xlarge_always_persisted_ssd_grafana.jpg)](runs/redis_long_set_network_single_client_i3.xlarge_always_persisted_ssd_grafana.jpg)


### Single client: Redis by local (i3.xlarge)
redis-benchmark on i3.xlarge (SSD mounted) hits local redis

```
redis-benchmark -t set -n 3000000 -c 1
```