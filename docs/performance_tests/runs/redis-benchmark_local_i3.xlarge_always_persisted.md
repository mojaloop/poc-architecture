- [Run details](#run-details)
- [Test #1 - Default benchmark (100k requests)](#test-1---default-benchmark-100k-requests)
- [Test #2 - 1M requests (default)](#test-2---1m-requests-default)
- [Test #3 - just SET (1M, for comparison)](#test-3---just-set-1m-for-comparison)
- [Test #4 - SET with random key](#test-4---set-with-random-key)
- [Test #5 - SET through LUA script](#test-5---set-through-lua-script)
- [Test #6 - SET (LUA) with participant-like key and 30 bytes data](#test-6---set-lua-with-participant-like-key-and-30-bytes-data)
- [Test #7 - SET (LUA) with participant-like key and 300 bytes data](#test-7---set-lua-with-participant-like-key-and-300-bytes-data)
- [Test #8 - SET (LUA) with participant-like key and 3000 bytes data](#test-8---set-lua-with-participant-like-key-and-3000-bytes-data)
- [Test #9 - SET with random key and 3000 bytes data](#test-9---set-with-random-key-and-3000-bytes-data)

# Run details
- Date: 2020-07-30
- Machine:
  - i3.xlarge (data on EBS)
  - k8s-tanuki-perf1-i3-xl-2
  - Ubuntu 16.04.4 LTS
- configured by k8s + helm
  - https://github.com/mojaloop/deploy-config/blob/22d0ad281092fbceee292962a2294cf3085ab78d/PI10/PoC/config/perf1-values-single.yaml
    - enabled "redis-persisted"
      - persistency is changed to "appendfsync always" by configmap
    - disabled everything else

# Test #1 - Default benchmark (100k requests)
```
$ redis-benchmark
====== PING_INLINE ======
  100000 requests completed in 1.25 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.00% <= 0.2 milliseconds
37.94% <= 0.3 milliseconds
93.46% <= 0.4 milliseconds
97.47% <= 0.5 milliseconds
98.99% <= 0.6 milliseconds
99.42% <= 0.7 milliseconds
99.60% <= 0.8 milliseconds
99.70% <= 0.9 milliseconds
99.77% <= 1.0 milliseconds
99.83% <= 1.1 milliseconds
99.89% <= 1.2 milliseconds
99.92% <= 1.3 milliseconds
99.93% <= 1.4 milliseconds
99.94% <= 1.5 milliseconds
99.94% <= 1.6 milliseconds
99.95% <= 1.7 milliseconds
99.95% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
79681.27 requests per second

====== PING_BULK ======
  100000 requests completed in 1.21 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.97% <= 1 milliseconds
100.00% <= 1 milliseconds
82712.98 requests per second

====== SET ======
  100000 requests completed in 6.32 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
17.60% <= 2 milliseconds
34.51% <= 3 milliseconds
95.27% <= 4 milliseconds
98.90% <= 5 milliseconds
99.30% <= 6 milliseconds
99.58% <= 7 milliseconds
99.72% <= 8 milliseconds
99.84% <= 9 milliseconds
99.88% <= 10 milliseconds
99.90% <= 11 milliseconds
99.91% <= 12 milliseconds
99.92% <= 13 milliseconds
99.95% <= 71 milliseconds
99.96% <= 72 milliseconds
99.97% <= 73 milliseconds
100.00% <= 73 milliseconds
15812.78 requests per second

====== GET ======
  100000 requests completed in 1.20 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.84% <= 1 milliseconds
100.00% <= 1 milliseconds
83194.67 requests per second

====== INCR ======
  100000 requests completed in 6.27 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
20.45% <= 2 milliseconds
33.38% <= 3 milliseconds
94.51% <= 4 milliseconds
98.07% <= 5 milliseconds
99.12% <= 6 milliseconds
99.50% <= 7 milliseconds
99.66% <= 8 milliseconds
99.82% <= 9 milliseconds
99.90% <= 10 milliseconds
99.96% <= 11 milliseconds
99.98% <= 16 milliseconds
100.00% <= 16 milliseconds
15938.79 requests per second

====== LPUSH ======
  100000 requests completed in 6.36 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
20.18% <= 2 milliseconds
33.00% <= 3 milliseconds
94.48% <= 4 milliseconds
97.46% <= 5 milliseconds
98.44% <= 6 milliseconds
98.81% <= 7 milliseconds
99.23% <= 8 milliseconds
99.49% <= 9 milliseconds
99.69% <= 10 milliseconds
99.79% <= 11 milliseconds
99.89% <= 12 milliseconds
99.93% <= 13 milliseconds
99.98% <= 16 milliseconds
100.00% <= 16 milliseconds
15730.69 requests per second

====== RPUSH ======
  100000 requests completed in 6.41 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
19.07% <= 2 milliseconds
33.22% <= 3 milliseconds
91.52% <= 4 milliseconds
97.61% <= 5 milliseconds
98.63% <= 6 milliseconds
99.08% <= 7 milliseconds
99.39% <= 8 milliseconds
99.67% <= 9 milliseconds
99.80% <= 10 milliseconds
99.88% <= 11 milliseconds
99.96% <= 12 milliseconds
99.98% <= 14 milliseconds
100.00% <= 15 milliseconds
100.00% <= 15 milliseconds
15593.33 requests per second

====== LPOP ======
  100000 requests completed in 6.26 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
20.03% <= 2 milliseconds
34.10% <= 3 milliseconds
94.74% <= 4 milliseconds
98.70% <= 5 milliseconds
99.06% <= 6 milliseconds
99.26% <= 7 milliseconds
99.50% <= 8 milliseconds
99.66% <= 9 milliseconds
99.82% <= 10 milliseconds
99.95% <= 11 milliseconds
100.00% <= 11 milliseconds
15976.99 requests per second

====== RPOP ======
  100000 requests completed in 6.18 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
21.75% <= 2 milliseconds
34.20% <= 3 milliseconds
96.03% <= 4 milliseconds
98.70% <= 5 milliseconds
99.36% <= 6 milliseconds
99.52% <= 7 milliseconds
99.66% <= 8 milliseconds
99.77% <= 9 milliseconds
99.89% <= 10 milliseconds
99.94% <= 11 milliseconds
99.98% <= 12 milliseconds
100.00% <= 12 milliseconds
16191.71 requests per second

====== SADD ======
  100000 requests completed in 1.27 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.95% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 2 milliseconds
78926.60 requests per second

====== HSET ======
  100000 requests completed in 6.45 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
14.48% <= 2 milliseconds
33.35% <= 3 milliseconds
92.52% <= 4 milliseconds
98.94% <= 5 milliseconds
99.24% <= 6 milliseconds
99.35% <= 7 milliseconds
99.55% <= 8 milliseconds
99.70% <= 9 milliseconds
99.86% <= 10 milliseconds
99.93% <= 11 milliseconds
99.98% <= 17 milliseconds
100.00% <= 17 milliseconds
15496.67 requests per second

====== SPOP ======
  100000 requests completed in 1.19 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.86% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 2 milliseconds
84317.03 requests per second

====== LPUSH (needed to benchmark LRANGE) ======
  100000 requests completed in 6.19 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
20.60% <= 2 milliseconds
33.92% <= 3 milliseconds
96.70% <= 4 milliseconds
99.01% <= 5 milliseconds
99.51% <= 6 milliseconds
99.61% <= 7 milliseconds
99.68% <= 8 milliseconds
99.76% <= 9 milliseconds
99.87% <= 10 milliseconds
99.92% <= 11 milliseconds
99.95% <= 12 milliseconds
99.98% <= 13 milliseconds
100.00% <= 14 milliseconds
100.00% <= 14 milliseconds
16149.87 requests per second

====== LRANGE_100 (first 100 elements) ======
  100000 requests completed in 2.28 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

93.59% <= 1 milliseconds
99.88% <= 2 milliseconds
99.90% <= 3 milliseconds
99.90% <= 4 milliseconds
99.92% <= 5 milliseconds
99.94% <= 6 milliseconds
99.95% <= 11 milliseconds
99.98% <= 12 milliseconds
99.99% <= 13 milliseconds
100.00% <= 13 milliseconds
43782.84 requests per second

====== LRANGE_300 (first 300 elements) ======
  100000 requests completed in 6.85 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.80% <= 1 milliseconds
58.03% <= 2 milliseconds
99.76% <= 3 milliseconds
99.92% <= 4 milliseconds
99.98% <= 5 milliseconds
99.99% <= 6 milliseconds
100.00% <= 7 milliseconds
100.00% <= 7 milliseconds
14594.28 requests per second

====== LRANGE_500 (first 450 elements) ======
  100000 requests completed in 7.84 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.04% <= 1 milliseconds
70.79% <= 2 milliseconds
97.76% <= 3 milliseconds
99.75% <= 4 milliseconds
99.90% <= 5 milliseconds
99.95% <= 6 milliseconds
99.96% <= 7 milliseconds
99.97% <= 8 milliseconds
99.98% <= 9 milliseconds
99.99% <= 10 milliseconds
99.99% <= 11 milliseconds
100.00% <= 12 milliseconds
100.00% <= 13 milliseconds
100.00% <= 13 milliseconds
12759.98 requests per second

====== LRANGE_600 (first 600 elements) ======
  100000 requests completed in 10.57 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.03% <= 1 milliseconds
21.81% <= 2 milliseconds
59.07% <= 3 milliseconds
99.12% <= 4 milliseconds
99.61% <= 5 milliseconds
99.80% <= 6 milliseconds
99.89% <= 7 milliseconds
99.93% <= 8 milliseconds
99.95% <= 9 milliseconds
99.96% <= 10 milliseconds
99.97% <= 11 milliseconds
99.98% <= 12 milliseconds
99.99% <= 13 milliseconds
100.00% <= 14 milliseconds
100.00% <= 15 milliseconds
9458.95 requests per second

====== MSET (10 keys) ======
  100000 requests completed in 7.41 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
0.12% <= 2 milliseconds
31.78% <= 3 milliseconds
58.83% <= 4 milliseconds
97.52% <= 5 milliseconds
99.33% <= 6 milliseconds
99.53% <= 7 milliseconds
99.68% <= 8 milliseconds
99.76% <= 9 milliseconds
99.88% <= 10 milliseconds
99.94% <= 11 milliseconds
99.95% <= 68 milliseconds
99.96% <= 70 milliseconds
100.00% <= 70 milliseconds
13498.92 requests per second
```
# Test #2 - 1M requests (default)
```
$ redis-benchmark -n 1000000
====== PING_INLINE ======
  1000000 requests completed in 12.15 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.00% <= 0.2 milliseconds
46.97% <= 0.3 milliseconds
94.64% <= 0.4 milliseconds
98.02% <= 0.5 milliseconds
99.31% <= 0.6 milliseconds
99.71% <= 0.7 milliseconds
99.88% <= 0.8 milliseconds
99.93% <= 0.9 milliseconds
99.94% <= 1.0 milliseconds
99.95% <= 1.1 milliseconds
99.96% <= 1.2 milliseconds
99.97% <= 1.3 milliseconds
99.97% <= 1.4 milliseconds
99.98% <= 1.5 milliseconds
99.98% <= 1.6 milliseconds
99.98% <= 1.7 milliseconds
99.99% <= 1.8 milliseconds
99.99% <= 1.9 milliseconds
99.99% <= 2 milliseconds
99.99% <= 3 milliseconds
99.99% <= 4 milliseconds
100.00% <= 4 milliseconds
82331.63 requests per second

====== PING_BULK ======
  1000000 requests completed in 12.17 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.93% <= 1 milliseconds
100.00% <= 2 milliseconds
100.00% <= 2 milliseconds
82176.02 requests per second

====== SET ======
  1000000 requests completed in 62.82 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
17.94% <= 2 milliseconds
33.35% <= 3 milliseconds
94.79% <= 4 milliseconds
98.83% <= 5 milliseconds
99.44% <= 6 milliseconds
99.65% <= 7 milliseconds
99.78% <= 8 milliseconds
99.85% <= 9 milliseconds
99.91% <= 10 milliseconds
99.96% <= 11 milliseconds
99.98% <= 12 milliseconds
99.99% <= 13 milliseconds
99.99% <= 15 milliseconds
100.00% <= 70 milliseconds
100.00% <= 71 milliseconds
100.00% <= 71 milliseconds
15918.75 requests per second

====== GET ======
  1000000 requests completed in 12.17 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.95% <= 1 milliseconds
99.99% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
82169.27 requests per second

====== INCR ======
  1000000 requests completed in 60.81 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
22.74% <= 2 milliseconds
34.23% <= 3 milliseconds
97.45% <= 4 milliseconds
99.19% <= 5 milliseconds
99.57% <= 6 milliseconds
99.73% <= 7 milliseconds
99.82% <= 8 milliseconds
99.87% <= 9 milliseconds
99.90% <= 10 milliseconds
99.94% <= 11 milliseconds
99.96% <= 12 milliseconds
99.97% <= 13 milliseconds
99.99% <= 14 milliseconds
99.99% <= 15 milliseconds
99.99% <= 16 milliseconds
99.99% <= 26 milliseconds
99.99% <= 27 milliseconds
99.99% <= 28 milliseconds
100.00% <= 70 milliseconds
100.00% <= 71 milliseconds
100.00% <= 72 milliseconds
100.00% <= 72 milliseconds
16443.31 requests per second

====== LPUSH ======
  1000000 requests completed in 62.67 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
19.51% <= 2 milliseconds
33.94% <= 3 milliseconds
95.35% <= 4 milliseconds
98.66% <= 5 milliseconds
99.26% <= 6 milliseconds
99.53% <= 7 milliseconds
99.70% <= 8 milliseconds
99.81% <= 9 milliseconds
99.89% <= 10 milliseconds
99.93% <= 11 milliseconds
99.96% <= 12 milliseconds
99.97% <= 13 milliseconds
99.98% <= 14 milliseconds
99.99% <= 17 milliseconds
99.99% <= 18 milliseconds
99.99% <= 19 milliseconds
100.00% <= 70 milliseconds
100.00% <= 71 milliseconds
100.00% <= 72 milliseconds
100.00% <= 72 milliseconds
15956.34 requests per second

====== RPUSH ======
  1000000 requests completed in 64.85 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
13.84% <= 2 milliseconds
33.67% <= 3 milliseconds
92.07% <= 4 milliseconds
98.40% <= 5 milliseconds
99.14% <= 6 milliseconds
99.43% <= 7 milliseconds
99.62% <= 8 milliseconds
99.78% <= 9 milliseconds
99.87% <= 10 milliseconds
99.92% <= 11 milliseconds
99.95% <= 12 milliseconds
99.97% <= 13 milliseconds
99.98% <= 15 milliseconds
99.98% <= 16 milliseconds
99.99% <= 18 milliseconds
99.99% <= 20 milliseconds
99.99% <= 27 milliseconds
99.99% <= 28 milliseconds
99.99% <= 69 milliseconds
99.99% <= 70 milliseconds
99.99% <= 71 milliseconds
100.00% <= 72 milliseconds
100.00% <= 72 milliseconds
15419.25 requests per second

====== LPOP ======
  1000000 requests completed in 63.58 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
16.84% <= 2 milliseconds
33.59% <= 3 milliseconds
94.51% <= 4 milliseconds
98.67% <= 5 milliseconds
99.30% <= 6 milliseconds
99.50% <= 7 milliseconds
99.66% <= 8 milliseconds
99.77% <= 9 milliseconds
99.85% <= 10 milliseconds
99.89% <= 11 milliseconds
99.92% <= 12 milliseconds
99.94% <= 13 milliseconds
99.96% <= 14 milliseconds
99.98% <= 15 milliseconds
99.99% <= 16 milliseconds
100.00% <= 17 milliseconds
100.00% <= 17 milliseconds
15727.23 requests per second

====== RPOP ======
  1000000 requests completed in 63.36 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
17.80% <= 2 milliseconds
33.54% <= 3 milliseconds
95.36% <= 4 milliseconds
98.61% <= 5 milliseconds
99.21% <= 6 milliseconds
99.42% <= 7 milliseconds
99.60% <= 8 milliseconds
99.75% <= 9 milliseconds
99.85% <= 10 milliseconds
99.90% <= 11 milliseconds
99.93% <= 12 milliseconds
99.95% <= 13 milliseconds
99.97% <= 14 milliseconds
99.97% <= 15 milliseconds
99.99% <= 16 milliseconds
99.99% <= 17 milliseconds
99.99% <= 18 milliseconds
99.99% <= 19 milliseconds
100.00% <= 72 milliseconds
100.00% <= 74 milliseconds
100.00% <= 74 milliseconds
15783.83 requests per second

====== SADD ======
  1000000 requests completed in 12.23 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.91% <= 1 milliseconds
99.99% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
81732.73 requests per second

====== HSET ======
  1000000 requests completed in 64.65 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
13.47% <= 2 milliseconds
34.05% <= 3 milliseconds
92.87% <= 4 milliseconds
98.61% <= 5 milliseconds
99.23% <= 6 milliseconds
99.48% <= 7 milliseconds
99.66% <= 8 milliseconds
99.80% <= 9 milliseconds
99.88% <= 10 milliseconds
99.94% <= 11 milliseconds
99.96% <= 12 milliseconds
99.97% <= 13 milliseconds
99.97% <= 16 milliseconds
99.98% <= 17 milliseconds
99.98% <= 18 milliseconds
99.98% <= 19 milliseconds
99.98% <= 20 milliseconds
99.99% <= 71 milliseconds
99.99% <= 72 milliseconds
100.00% <= 73 milliseconds
100.00% <= 73 milliseconds
15466.95 requests per second

====== SPOP ======
  1000000 requests completed in 12.40 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.91% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 2 milliseconds
80625.66 requests per second

====== LPUSH (needed to benchmark LRANGE) ======
  1000000 requests completed in 63.66 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
17.76% <= 2 milliseconds
33.42% <= 3 milliseconds
94.09% <= 4 milliseconds
98.28% <= 5 milliseconds
99.12% <= 6 milliseconds
99.42% <= 7 milliseconds
99.62% <= 8 milliseconds
99.76% <= 9 milliseconds
99.87% <= 10 milliseconds
99.93% <= 11 milliseconds
99.95% <= 12 milliseconds
99.97% <= 13 milliseconds
99.98% <= 14 milliseconds
99.98% <= 15 milliseconds
99.98% <= 16 milliseconds
99.98% <= 17 milliseconds
99.99% <= 18 milliseconds
99.99% <= 19 milliseconds
99.99% <= 20 milliseconds
100.00% <= 70 milliseconds
100.00% <= 71 milliseconds
100.00% <= 71 milliseconds
15708.70 requests per second

====== LRANGE_100 (first 100 elements) ======
  1000000 requests completed in 23.56 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

98.99% <= 1 milliseconds
99.94% <= 2 milliseconds
99.98% <= 3 milliseconds
99.98% <= 4 milliseconds
99.99% <= 5 milliseconds
99.99% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 10 milliseconds
42443.02 requests per second

====== LRANGE_300 (first 300 elements) ======
  1000000 requests completed in 62.06 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

1.04% <= 1 milliseconds
70.56% <= 2 milliseconds
99.66% <= 3 milliseconds
99.88% <= 4 milliseconds
99.95% <= 5 milliseconds
99.97% <= 6 milliseconds
99.98% <= 7 milliseconds
99.99% <= 8 milliseconds
99.99% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 11 milliseconds
100.00% <= 11 milliseconds
16113.44 requests per second

====== LRANGE_500 (first 450 elements) ======
  1000000 requests completed in 82.31 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.04% <= 1 milliseconds
61.19% <= 2 milliseconds
98.44% <= 3 milliseconds
99.66% <= 4 milliseconds
99.86% <= 5 milliseconds
99.93% <= 6 milliseconds
99.96% <= 7 milliseconds
99.97% <= 8 milliseconds
99.98% <= 9 milliseconds
99.99% <= 10 milliseconds
99.99% <= 11 milliseconds
100.00% <= 12 milliseconds
100.00% <= 13 milliseconds
100.00% <= 14 milliseconds
100.00% <= 16 milliseconds
100.00% <= 16 milliseconds
12149.63 requests per second

====== LRANGE_600 (first 600 elements) ======
  1000000 requests completed in 105.63 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.02% <= 1 milliseconds
21.46% <= 2 milliseconds
58.85% <= 3 milliseconds
99.37% <= 4 milliseconds
99.75% <= 5 milliseconds
99.89% <= 6 milliseconds
99.95% <= 7 milliseconds
99.98% <= 8 milliseconds
99.99% <= 9 milliseconds
99.99% <= 10 milliseconds
100.00% <= 11 milliseconds
100.00% <= 12 milliseconds
100.00% <= 13 milliseconds
100.00% <= 13 milliseconds
9466.83 requests per second

====== MSET (10 keys) ======
  1000000 requests completed in 76.33 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1 milliseconds
0.04% <= 2 milliseconds
32.89% <= 3 milliseconds
51.05% <= 4 milliseconds
95.25% <= 5 milliseconds
98.75% <= 6 milliseconds
99.21% <= 7 milliseconds
99.40% <= 8 milliseconds
99.56% <= 9 milliseconds
99.64% <= 10 milliseconds
99.74% <= 11 milliseconds
99.80% <= 12 milliseconds
99.82% <= 13 milliseconds
99.83% <= 14 milliseconds
99.85% <= 15 milliseconds
99.85% <= 16 milliseconds
99.86% <= 17 milliseconds
99.87% <= 18 milliseconds
99.88% <= 19 milliseconds
99.89% <= 20 milliseconds
99.90% <= 21 milliseconds
99.91% <= 22 milliseconds
99.91% <= 23 milliseconds
99.92% <= 24 milliseconds
99.92% <= 25 milliseconds
99.92% <= 26 milliseconds
99.93% <= 27 milliseconds
99.93% <= 28 milliseconds
99.93% <= 29 milliseconds
99.94% <= 31 milliseconds
99.94% <= 39 milliseconds
99.94% <= 49 milliseconds
99.94% <= 54 milliseconds
99.94% <= 55 milliseconds
99.95% <= 56 milliseconds
99.95% <= 66 milliseconds
99.95% <= 68 milliseconds
99.95% <= 69 milliseconds
99.95% <= 70 milliseconds
99.96% <= 71 milliseconds
99.97% <= 72 milliseconds
99.97% <= 73 milliseconds
99.98% <= 74 milliseconds
99.99% <= 77 milliseconds
99.99% <= 79 milliseconds
99.99% <= 80 milliseconds
99.99% <= 85 milliseconds
100.00% <= 87 milliseconds
100.00% <= 93 milliseconds
100.00% <= 93 milliseconds
13100.32 requests per second
```
# Test #3 - just SET (1M, for comparison)
```
$ redis-benchmark -t set -n 1000000
====== SET ======
  1000000 requests completed in 62.87 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1.6 milliseconds
0.03% <= 1.7 milliseconds
1.61% <= 1.8 milliseconds
8.51% <= 1.9 milliseconds
17.87% <= 2 milliseconds
34.52% <= 3 milliseconds
94.92% <= 4 milliseconds
98.64% <= 5 milliseconds
99.26% <= 6 milliseconds
99.52% <= 7 milliseconds
99.70% <= 8 milliseconds
99.82% <= 9 milliseconds
99.88% <= 10 milliseconds
99.92% <= 11 milliseconds
99.95% <= 12 milliseconds
99.99% <= 13 milliseconds
99.99% <= 14 milliseconds
99.99% <= 15 milliseconds
100.00% <= 68 milliseconds
100.00% <= 70 milliseconds
100.00% <= 70 milliseconds
15906.85 requests per second
```
# Test #4 - SET with random key
```
$ redis-benchmark -t set -r 10000 -n 1000000
====== SET ======
  1000000 requests completed in 62.62 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1.5 milliseconds
0.00% <= 1.6 milliseconds
0.05% <= 1.7 milliseconds
2.09% <= 1.8 milliseconds
9.56% <= 1.9 milliseconds
18.90% <= 2 milliseconds
34.48% <= 3 milliseconds
95.31% <= 4 milliseconds
98.46% <= 5 milliseconds
99.00% <= 6 milliseconds
99.28% <= 7 milliseconds
99.52% <= 8 milliseconds
99.71% <= 9 milliseconds
99.85% <= 10 milliseconds
99.92% <= 11 milliseconds
99.96% <= 12 milliseconds
99.99% <= 13 milliseconds
99.99% <= 14 milliseconds
100.00% <= 17 milliseconds
100.00% <= 18 milliseconds
100.00% <= 19 milliseconds
100.00% <= 19 milliseconds
15970.61 requests per second
```
# Test #5 - SET through LUA script
```
$ redis-benchmark -n 1000000 script load "redis.call('set', '123456789012', '123')"
====== script load redis.call('set', '123456789012', '123') ======
  1000000 requests completed in 67.25 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1.5 milliseconds
0.00% <= 1.6 milliseconds
0.00% <= 1.7 milliseconds
0.31% <= 1.8 milliseconds
3.45% <= 1.9 milliseconds
10.88% <= 2 milliseconds
33.50% <= 3 milliseconds
89.85% <= 4 milliseconds
97.19% <= 5 milliseconds
97.88% <= 6 milliseconds
98.49% <= 7 milliseconds
98.72% <= 8 milliseconds
98.89% <= 9 milliseconds
99.04% <= 10 milliseconds
99.28% <= 11 milliseconds
99.57% <= 12 milliseconds
99.86% <= 13 milliseconds
99.94% <= 14 milliseconds
99.97% <= 15 milliseconds
99.97% <= 16 milliseconds
99.98% <= 17 milliseconds
99.98% <= 19 milliseconds
99.98% <= 20 milliseconds
99.98% <= 21 milliseconds
99.99% <= 22 milliseconds
99.99% <= 23 milliseconds
100.00% <= 47 milliseconds
100.00% <= 48 milliseconds
100.00% <= 49 milliseconds
100.00% <= 52 milliseconds
100.00% <= 52 milliseconds
14869.00 requests per second
```
# Test #6 - SET (LUA) with participant-like key and 30 bytes data
```
$ redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789')"
====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789') ======
  1000000 requests completed in 66.79 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1.6 milliseconds
0.00% <= 1.7 milliseconds
0.03% <= 1.8 milliseconds
0.60% <= 1.9 milliseconds
6.72% <= 2 milliseconds
33.60% <= 3 milliseconds
87.99% <= 4 milliseconds
98.44% <= 5 milliseconds
99.12% <= 6 milliseconds
99.48% <= 7 milliseconds
99.69% <= 8 milliseconds
99.82% <= 9 milliseconds
99.90% <= 10 milliseconds
99.95% <= 11 milliseconds
99.98% <= 12 milliseconds
99.99% <= 13 milliseconds
100.00% <= 17 milliseconds
100.00% <= 19 milliseconds
100.00% <= 21 milliseconds
100.00% <= 22 milliseconds
100.00% <= 22 milliseconds
14972.08 requests per second
```
# Test #7 - SET (LUA) with participant-like key and 300 bytes data
```
redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789')"
====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789') ======
  1000000 requests completed in 70.18 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1.5 milliseconds
0.00% <= 1.6 milliseconds
0.00% <= 1.7 milliseconds
0.00% <= 1.8 milliseconds
0.01% <= 1.9 milliseconds
0.80% <= 2 milliseconds
33.30% <= 3 milliseconds
74.01% <= 4 milliseconds
98.38% <= 5 milliseconds
99.45% <= 6 milliseconds
99.61% <= 7 milliseconds
99.73% <= 8 milliseconds
99.81% <= 9 milliseconds
99.88% <= 10 milliseconds
99.92% <= 11 milliseconds
99.95% <= 12 milliseconds
99.96% <= 13 milliseconds
99.97% <= 14 milliseconds
99.97% <= 15 milliseconds
99.97% <= 16 milliseconds
99.98% <= 17 milliseconds
99.98% <= 18 milliseconds
99.99% <= 19 milliseconds
100.00% <= 20 milliseconds
100.00% <= 23 milliseconds
100.00% <= 29 milliseconds
100.00% <= 29 milliseconds
14249.07 requests per second
```
# Test #8 - SET (LUA) with participant-like key and 3000 bytes data
```
redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789')"
====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789') ======
  1000000 requests completed in 102.31 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 1.6 milliseconds
0.00% <= 1.7 milliseconds
0.00% <= 1.8 milliseconds
0.00% <= 2 milliseconds
15.61% <= 3 milliseconds
29.73% <= 4 milliseconds
36.39% <= 5 milliseconds
87.81% <= 6 milliseconds
97.74% <= 7 milliseconds
98.81% <= 8 milliseconds
99.16% <= 9 milliseconds
99.33% <= 10 milliseconds
99.43% <= 11 milliseconds
99.50% <= 12 milliseconds
99.56% <= 13 milliseconds
99.57% <= 14 milliseconds
99.58% <= 15 milliseconds
99.58% <= 16 milliseconds
99.58% <= 17 milliseconds
99.59% <= 18 milliseconds
99.61% <= 19 milliseconds
99.63% <= 20 milliseconds
99.67% <= 21 milliseconds
99.75% <= 22 milliseconds
99.77% <= 23 milliseconds
99.78% <= 24 milliseconds
99.79% <= 26 milliseconds
99.79% <= 27 milliseconds
99.80% <= 68 milliseconds
99.80% <= 69 milliseconds
99.80% <= 70 milliseconds
99.80% <= 71 milliseconds
99.81% <= 72 milliseconds
99.82% <= 73 milliseconds
99.84% <= 74 milliseconds
99.87% <= 75 milliseconds
99.89% <= 76 milliseconds
99.93% <= 77 milliseconds
99.95% <= 78 milliseconds
99.97% <= 79 milliseconds
99.98% <= 80 milliseconds
99.99% <= 81 milliseconds
99.99% <= 82 milliseconds
100.00% <= 84 milliseconds
100.00% <= 85 milliseconds
100.00% <= 88 milliseconds
100.00% <= 88 milliseconds
9774.50 requests per second
```

# Test #9 - SET with random key and 3000 bytes data
```
$ redis-benchmark -t set -r 10000 -d 3000 -n 1000000
====== SET ======
  1000000 requests completed in 33.01 seconds
  50 parallel clients
  3000 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.4 milliseconds
0.00% <= 0.5 milliseconds
0.01% <= 0.6 milliseconds
0.04% <= 0.7 milliseconds
0.17% <= 0.8 milliseconds
4.01% <= 0.9 milliseconds
12.16% <= 1.0 milliseconds
19.64% <= 1.1 milliseconds
30.65% <= 1.2 milliseconds
44.62% <= 1.3 milliseconds
55.74% <= 1.4 milliseconds
66.88% <= 1.5 milliseconds
76.17% <= 1.6 milliseconds
82.59% <= 1.7 milliseconds
86.78% <= 1.8 milliseconds
89.80% <= 1.9 milliseconds
92.07% <= 2 milliseconds
99.00% <= 3 milliseconds
99.33% <= 4 milliseconds
99.45% <= 5 milliseconds
99.49% <= 6 milliseconds
99.52% <= 7 milliseconds
99.55% <= 8 milliseconds
99.58% <= 9 milliseconds
99.59% <= 10 milliseconds
99.61% <= 11 milliseconds
99.63% <= 12 milliseconds
99.64% <= 13 milliseconds
99.66% <= 14 milliseconds
99.69% <= 15 milliseconds
99.70% <= 16 milliseconds
99.72% <= 17 milliseconds
99.75% <= 18 milliseconds
99.76% <= 19 milliseconds
99.77% <= 20 milliseconds
99.80% <= 21 milliseconds
99.82% <= 22 milliseconds
99.82% <= 23 milliseconds
99.83% <= 24 milliseconds
99.84% <= 25 milliseconds
99.85% <= 26 milliseconds
99.85% <= 27 milliseconds
99.86% <= 28 milliseconds
99.87% <= 29 milliseconds
99.88% <= 30 milliseconds
99.88% <= 31 milliseconds
99.88% <= 32 milliseconds
99.89% <= 33 milliseconds
99.91% <= 34 milliseconds
99.91% <= 39 milliseconds
99.92% <= 40 milliseconds
99.92% <= 41 milliseconds
99.92% <= 45 milliseconds
99.92% <= 46 milliseconds
99.93% <= 47 milliseconds
99.93% <= 48 milliseconds
99.94% <= 50 milliseconds
99.94% <= 51 milliseconds
99.95% <= 52 milliseconds
99.95% <= 53 milliseconds
99.95% <= 56 milliseconds
99.95% <= 57 milliseconds
99.95% <= 58 milliseconds
99.95% <= 59 milliseconds
99.96% <= 79 milliseconds
99.96% <= 80 milliseconds
99.96% <= 81 milliseconds
99.97% <= 82 milliseconds
99.98% <= 83 milliseconds
99.99% <= 84 milliseconds
100.00% <= 85 milliseconds
100.00% <= 85 milliseconds
30296.60 requests per second
```