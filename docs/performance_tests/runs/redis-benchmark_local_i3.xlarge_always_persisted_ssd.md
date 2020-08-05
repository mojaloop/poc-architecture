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
  - i3.xlarge (data on SSD)
  - k8s-tanuki-perf1-i3-xl-1
  - Ubuntu 16.04.4 LTS
- configured by k8s + helm
  - https://github.com/mojaloop/deploy-config/blob/22d0ad281092fbceee292962a2294cf3085ab78d/PI10/PoC/config/perf1-values-single.yaml
    - enabled "redis-persisted"
      - persistency is changed to "appendfsync always" by configmap
    - disabled everything else

# Test #1 - Default benchmark (100k requests)
```
redis-benchmark
====== PING_INLINE ======
  100000 requests completed in 1.57 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.03% <= 0.3 milliseconds
62.75% <= 0.4 milliseconds
93.24% <= 0.5 milliseconds
98.44% <= 0.6 milliseconds
99.62% <= 0.7 milliseconds
99.86% <= 0.8 milliseconds
99.90% <= 0.9 milliseconds
99.96% <= 1.0 milliseconds
99.98% <= 1.1 milliseconds
99.98% <= 1.2 milliseconds
99.99% <= 1.3 milliseconds
99.99% <= 1.4 milliseconds
100.00% <= 1.5 milliseconds
100.00% <= 1.6 milliseconds
100.00% <= 1.6 milliseconds
63897.76 requests per second

====== PING_BULK ======
  100000 requests completed in 1.60 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.05% <= 0.3 milliseconds
59.90% <= 0.4 milliseconds
88.62% <= 0.5 milliseconds
98.08% <= 0.6 milliseconds
99.36% <= 0.7 milliseconds
99.64% <= 0.8 milliseconds
99.80% <= 0.9 milliseconds
99.86% <= 1.0 milliseconds
99.89% <= 1.1 milliseconds
99.92% <= 1.2 milliseconds
99.93% <= 1.3 milliseconds
99.95% <= 1.4 milliseconds
99.96% <= 1.5 milliseconds
99.96% <= 1.6 milliseconds
99.99% <= 1.7 milliseconds
100.00% <= 1.8 milliseconds
100.00% <= 1.8 milliseconds
62539.09 requests per second

====== SET ======
  100000 requests completed in 2.06 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.3 milliseconds
0.02% <= 0.4 milliseconds
0.44% <= 0.5 milliseconds
3.15% <= 0.6 milliseconds
17.07% <= 0.7 milliseconds
34.01% <= 0.8 milliseconds
50.80% <= 0.9 milliseconds
71.53% <= 1.0 milliseconds
83.26% <= 1.1 milliseconds
90.00% <= 1.2 milliseconds
94.35% <= 1.3 milliseconds
97.68% <= 1.4 milliseconds
98.70% <= 1.5 milliseconds
99.07% <= 1.6 milliseconds
99.30% <= 1.7 milliseconds
99.44% <= 1.8 milliseconds
99.56% <= 1.9 milliseconds
99.67% <= 2 milliseconds
99.92% <= 3 milliseconds
99.97% <= 4 milliseconds
100.00% <= 4 milliseconds
48614.49 requests per second

====== GET ======
  100000 requests completed in 1.48 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.89% <= 1 milliseconds
100.00% <= 1 milliseconds
67659.00 requests per second

====== INCR ======
  100000 requests completed in 1.98 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

78.07% <= 1 milliseconds
99.61% <= 2 milliseconds
99.71% <= 3 milliseconds
99.82% <= 4 milliseconds
99.87% <= 5 milliseconds
99.88% <= 6 milliseconds
99.89% <= 7 milliseconds
99.93% <= 8 milliseconds
99.97% <= 9 milliseconds
99.98% <= 13 milliseconds
100.00% <= 13 milliseconds
50505.05 requests per second

====== LPUSH ======
  100000 requests completed in 2.04 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

71.55% <= 1 milliseconds
99.83% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 3 milliseconds
49043.65 requests per second

====== RPUSH ======
  100000 requests completed in 2.00 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

75.18% <= 1 milliseconds
99.81% <= 2 milliseconds
99.98% <= 3 milliseconds
100.00% <= 3 milliseconds
50025.02 requests per second

====== LPOP ======
  100000 requests completed in 1.94 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

79.40% <= 1 milliseconds
99.73% <= 2 milliseconds
99.85% <= 3 milliseconds
99.90% <= 5 milliseconds
99.96% <= 6 milliseconds
99.98% <= 7 milliseconds
100.00% <= 7 milliseconds
51599.59 requests per second

====== RPOP ======
  100000 requests completed in 2.00 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

75.58% <= 1 milliseconds
99.69% <= 2 milliseconds
99.93% <= 3 milliseconds
99.95% <= 7 milliseconds
99.97% <= 8 milliseconds
100.00% <= 8 milliseconds
50050.05 requests per second

====== SADD ======
  100000 requests completed in 1.53 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.97% <= 1 milliseconds
100.00% <= 1 milliseconds
65530.80 requests per second

====== HSET ======
  100000 requests completed in 2.00 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

74.67% <= 1 milliseconds
99.80% <= 2 milliseconds
99.90% <= 3 milliseconds
99.93% <= 4 milliseconds
99.95% <= 6 milliseconds
99.97% <= 7 milliseconds
100.00% <= 7 milliseconds
50050.05 requests per second

====== SPOP ======
  100000 requests completed in 1.61 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.88% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 2 milliseconds
62266.50 requests per second

====== LPUSH (needed to benchmark LRANGE) ======
  100000 requests completed in 2.07 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

71.60% <= 1 milliseconds
99.43% <= 2 milliseconds
99.75% <= 3 milliseconds
99.81% <= 4 milliseconds
99.90% <= 10 milliseconds
99.92% <= 11 milliseconds
99.95% <= 21 milliseconds
100.00% <= 21 milliseconds
48239.27 requests per second

====== LRANGE_100 (first 100 elements) ======
  100000 requests completed in 2.68 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

98.55% <= 1 milliseconds
99.89% <= 2 milliseconds
99.97% <= 3 milliseconds
100.00% <= 3 milliseconds
37299.52 requests per second

====== LRANGE_300 (first 300 elements) ======
  100000 requests completed in 7.22 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.19% <= 1 milliseconds
47.54% <= 2 milliseconds
99.64% <= 3 milliseconds
99.87% <= 4 milliseconds
99.97% <= 5 milliseconds
100.00% <= 6 milliseconds
100.00% <= 6 milliseconds
13842.75 requests per second

====== LRANGE_500 (first 450 elements) ======
  100000 requests completed in 9.63 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.03% <= 1 milliseconds
41.09% <= 2 milliseconds
83.26% <= 3 milliseconds
99.61% <= 4 milliseconds
99.84% <= 5 milliseconds
99.94% <= 6 milliseconds
99.95% <= 7 milliseconds
99.96% <= 8 milliseconds
99.98% <= 9 milliseconds
99.99% <= 10 milliseconds
100.00% <= 10 milliseconds
10388.53 requests per second

====== LRANGE_600 (first 600 elements) ======
  100000 requests completed in 11.32 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.02% <= 1 milliseconds
11.89% <= 2 milliseconds
52.94% <= 3 milliseconds
99.40% <= 4 milliseconds
99.72% <= 5 milliseconds
99.88% <= 6 milliseconds
99.96% <= 7 milliseconds
99.99% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 9 milliseconds
8832.36 requests per second

====== MSET (10 keys) ======
  100000 requests completed in 2.67 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

24.40% <= 1 milliseconds
98.89% <= 2 milliseconds
99.72% <= 3 milliseconds
99.92% <= 4 milliseconds
99.95% <= 21 milliseconds
99.97% <= 22 milliseconds
100.00% <= 22 milliseconds
37495.31 requests per second
```
# Test #2 - 1M requests (default)
```
redis-benchmark -n 1000000
====== PING_INLINE ======
  1000000 requests completed in 15.47 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.00% <= 0.2 milliseconds
0.04% <= 0.3 milliseconds
66.38% <= 0.4 milliseconds
91.99% <= 0.5 milliseconds
97.78% <= 0.6 milliseconds
99.23% <= 0.7 milliseconds
99.63% <= 0.8 milliseconds
99.79% <= 0.9 milliseconds
99.85% <= 1.0 milliseconds
99.88% <= 1.1 milliseconds
99.91% <= 1.2 milliseconds
99.93% <= 1.3 milliseconds
99.95% <= 1.4 milliseconds
99.96% <= 1.5 milliseconds
99.97% <= 1.6 milliseconds
99.98% <= 1.7 milliseconds
99.98% <= 1.8 milliseconds
99.98% <= 1.9 milliseconds
99.99% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
64632.88 requests per second

====== PING_BULK ======
  1000000 requests completed in 15.87 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.86% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 2 milliseconds
62996.10 requests per second

====== SET ======
  1000000 requests completed in 20.13 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

74.53% <= 1 milliseconds
99.71% <= 2 milliseconds
99.90% <= 3 milliseconds
99.93% <= 4 milliseconds
99.95% <= 5 milliseconds
99.97% <= 6 milliseconds
99.98% <= 7 milliseconds
99.99% <= 8 milliseconds
99.99% <= 9 milliseconds
99.99% <= 10 milliseconds
100.00% <= 20 milliseconds
100.00% <= 20 milliseconds
49667.23 requests per second

====== GET ======
  1000000 requests completed in 15.95 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.87% <= 1 milliseconds
99.98% <= 2 milliseconds
99.99% <= 4 milliseconds
100.00% <= 6 milliseconds
100.00% <= 7 milliseconds
100.00% <= 7 milliseconds
62680.20 requests per second

====== INCR ======
  1000000 requests completed in 19.37 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

79.84% <= 1 milliseconds
99.72% <= 2 milliseconds
99.91% <= 3 milliseconds
99.96% <= 4 milliseconds
99.96% <= 5 milliseconds
99.97% <= 6 milliseconds
99.98% <= 7 milliseconds
99.98% <= 8 milliseconds
99.98% <= 9 milliseconds
99.99% <= 10 milliseconds
99.99% <= 11 milliseconds
99.99% <= 12 milliseconds
100.00% <= 19 milliseconds
100.00% <= 20 milliseconds
100.00% <= 20 milliseconds
51634.22 requests per second

====== LPUSH ======
  1000000 requests completed in 20.03 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

74.59% <= 1 milliseconds
99.72% <= 2 milliseconds
99.90% <= 3 milliseconds
99.95% <= 4 milliseconds
99.97% <= 5 milliseconds
99.97% <= 6 milliseconds
99.98% <= 7 milliseconds
99.99% <= 8 milliseconds
99.99% <= 9 milliseconds
100.00% <= 20 milliseconds
100.00% <= 21 milliseconds
100.00% <= 21 milliseconds
49912.65 requests per second

====== RPUSH ======
  1000000 requests completed in 19.71 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

76.96% <= 1 milliseconds
99.76% <= 2 milliseconds
99.90% <= 3 milliseconds
99.95% <= 4 milliseconds
99.97% <= 5 milliseconds
99.98% <= 6 milliseconds
99.98% <= 7 milliseconds
99.99% <= 8 milliseconds
99.99% <= 13 milliseconds
100.00% <= 19 milliseconds
100.00% <= 20 milliseconds
100.00% <= 20 milliseconds
50738.24 requests per second

====== LPOP ======
  1000000 requests completed in 19.55 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

78.30% <= 1 milliseconds
99.69% <= 2 milliseconds
99.89% <= 3 milliseconds
99.94% <= 4 milliseconds
99.97% <= 5 milliseconds
99.97% <= 7 milliseconds
99.97% <= 8 milliseconds
99.98% <= 9 milliseconds
99.99% <= 10 milliseconds
99.99% <= 11 milliseconds
99.99% <= 16 milliseconds
99.99% <= 17 milliseconds
100.00% <= 21 milliseconds
100.00% <= 21 milliseconds
51145.66 requests per second

====== RPOP ======
  1000000 requests completed in 19.47 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

78.71% <= 1 milliseconds
99.74% <= 2 milliseconds
99.90% <= 3 milliseconds
99.95% <= 4 milliseconds
99.97% <= 5 milliseconds
99.98% <= 7 milliseconds
99.98% <= 8 milliseconds
99.99% <= 9 milliseconds
100.00% <= 20 milliseconds
100.00% <= 21 milliseconds
100.00% <= 21 milliseconds
51368.98 requests per second

====== SADD ======
  1000000 requests completed in 15.72 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.90% <= 1 milliseconds
99.98% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 3 milliseconds
63613.23 requests per second

====== HSET ======
  1000000 requests completed in 20.50 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

71.13% <= 1 milliseconds
99.71% <= 2 milliseconds
99.89% <= 3 milliseconds
99.94% <= 4 milliseconds
99.96% <= 5 milliseconds
99.97% <= 6 milliseconds
99.98% <= 7 milliseconds
99.98% <= 8 milliseconds
99.98% <= 9 milliseconds
99.99% <= 12 milliseconds
99.99% <= 13 milliseconds
99.99% <= 20 milliseconds
99.99% <= 21 milliseconds
100.00% <= 22 milliseconds
100.00% <= 23 milliseconds
100.00% <= 23 milliseconds
48780.49 requests per second

====== SPOP ======
  1000000 requests completed in 15.57 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.90% <= 1 milliseconds
99.97% <= 2 milliseconds
99.98% <= 3 milliseconds
99.99% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 5 milliseconds
64226.08 requests per second

====== LPUSH (needed to benchmark LRANGE) ======
  1000000 requests completed in 20.08 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

74.28% <= 1 milliseconds
99.77% <= 2 milliseconds
99.94% <= 3 milliseconds
99.96% <= 4 milliseconds
99.97% <= 5 milliseconds
99.98% <= 6 milliseconds
99.98% <= 7 milliseconds
99.98% <= 8 milliseconds
99.99% <= 9 milliseconds
100.00% <= 21 milliseconds
100.00% <= 22 milliseconds
100.00% <= 22 milliseconds
49800.80 requests per second

====== LRANGE_100 (first 100 elements) ======
  1000000 requests completed in 26.17 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

98.16% <= 1 milliseconds
99.91% <= 2 milliseconds
99.97% <= 3 milliseconds
99.98% <= 4 milliseconds
99.98% <= 5 milliseconds
99.99% <= 6 milliseconds
99.99% <= 7 milliseconds
100.00% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 11 milliseconds
100.00% <= 11 milliseconds
38207.31 requests per second

====== LRANGE_300 (first 300 elements) ======
  1000000 requests completed in 65.64 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.17% <= 1 milliseconds
61.41% <= 2 milliseconds
99.63% <= 3 milliseconds
99.87% <= 4 milliseconds
99.93% <= 5 milliseconds
99.97% <= 6 milliseconds
99.98% <= 7 milliseconds
99.99% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 11 milliseconds
100.00% <= 12 milliseconds
100.00% <= 12 milliseconds
15233.92 requests per second

====== LRANGE_500 (first 450 elements) ======
  1000000 requests completed in 88.57 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.03% <= 1 milliseconds
56.26% <= 2 milliseconds
87.18% <= 3 milliseconds
99.57% <= 4 milliseconds
99.78% <= 5 milliseconds
99.89% <= 6 milliseconds
99.94% <= 7 milliseconds
99.96% <= 8 milliseconds
99.98% <= 9 milliseconds
99.99% <= 10 milliseconds
99.99% <= 11 milliseconds
100.00% <= 12 milliseconds
100.00% <= 13 milliseconds
100.00% <= 14 milliseconds
100.00% <= 15 milliseconds
11290.50 requests per second

====== LRANGE_600 (first 600 elements) ======
  1000000 requests completed in 112.14 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.02% <= 1 milliseconds
13.97% <= 2 milliseconds
54.28% <= 3 milliseconds
99.06% <= 4 milliseconds
99.63% <= 5 milliseconds
99.82% <= 6 milliseconds
99.90% <= 7 milliseconds
99.95% <= 8 milliseconds
99.97% <= 9 milliseconds
99.98% <= 10 milliseconds
99.99% <= 11 milliseconds
99.99% <= 12 milliseconds
99.99% <= 13 milliseconds
100.00% <= 14 milliseconds
100.00% <= 15 milliseconds
100.00% <= 17 milliseconds
100.00% <= 18 milliseconds
100.00% <= 19 milliseconds
100.00% <= 20 milliseconds
100.00% <= 21 milliseconds
100.00% <= 22 milliseconds
8917.58 requests per second

====== MSET (10 keys) ======
  1000000 requests completed in 25.40 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

32.93% <= 1 milliseconds
99.22% <= 2 milliseconds
99.69% <= 3 milliseconds
99.78% <= 4 milliseconds
99.84% <= 5 milliseconds
99.88% <= 6 milliseconds
99.91% <= 7 milliseconds
99.92% <= 8 milliseconds
99.93% <= 9 milliseconds
99.94% <= 12 milliseconds
99.94% <= 13 milliseconds
99.96% <= 14 milliseconds
99.97% <= 16 milliseconds
99.97% <= 19 milliseconds
99.97% <= 20 milliseconds
99.98% <= 21 milliseconds
100.00% <= 23 milliseconds
100.00% <= 24 milliseconds
100.00% <= 24 milliseconds
39365.43 requests per second
```
# Test #3 - just SET (1M, for comparison)
```
$ redis-benchmark -t set -n 1000000
I have no name!@redistest-redis-persisted-master-0:/$ redis-benchmark -t set -n 1000000
====== SET ======
  1000000 requests completed in 19.48 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.3 milliseconds
0.03% <= 0.4 milliseconds
0.38% <= 0.5 milliseconds
2.52% <= 0.6 milliseconds
21.12% <= 0.7 milliseconds
44.94% <= 0.8 milliseconds
61.32% <= 0.9 milliseconds
78.28% <= 1.0 milliseconds
89.83% <= 1.1 milliseconds
94.91% <= 1.2 milliseconds
97.06% <= 1.3 milliseconds
98.77% <= 1.4 milliseconds
99.39% <= 1.5 milliseconds
99.56% <= 1.6 milliseconds
99.65% <= 1.7 milliseconds
99.71% <= 1.8 milliseconds
99.76% <= 1.9 milliseconds
99.79% <= 2 milliseconds
99.92% <= 3 milliseconds
99.97% <= 4 milliseconds
99.98% <= 5 milliseconds
99.99% <= 6 milliseconds
99.99% <= 7 milliseconds
100.00% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 9 milliseconds
51332.07 requests per second
```
# Test #4 - SET with random key
```
$ redis-benchmark -t set -r 10000 -n 1000000
====== SET ======
  1000000 requests completed in 20.37 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.3 milliseconds
0.01% <= 0.4 milliseconds
0.24% <= 0.5 milliseconds
1.56% <= 0.6 milliseconds
14.70% <= 0.7 milliseconds
38.51% <= 0.8 milliseconds
53.73% <= 0.9 milliseconds
72.53% <= 1.0 milliseconds
84.99% <= 1.1 milliseconds
92.64% <= 1.2 milliseconds
95.58% <= 1.3 milliseconds
97.77% <= 1.4 milliseconds
99.04% <= 1.5 milliseconds
99.33% <= 1.6 milliseconds
99.48% <= 1.7 milliseconds
99.57% <= 1.8 milliseconds
99.64% <= 1.9 milliseconds
99.69% <= 2 milliseconds
99.87% <= 3 milliseconds
99.91% <= 4 milliseconds
99.94% <= 5 milliseconds
99.95% <= 6 milliseconds
99.96% <= 7 milliseconds
99.98% <= 8 milliseconds
99.99% <= 11 milliseconds
99.99% <= 12 milliseconds
99.99% <= 13 milliseconds
99.99% <= 14 milliseconds
99.99% <= 15 milliseconds
99.99% <= 16 milliseconds
100.00% <= 17 milliseconds
100.00% <= 17 milliseconds
49084.57 requests per second
```
# Test #5 - SET through LUA script
```
$ redis-benchmark -n 1000000 script load "redis.call('set', '123456789012', '123')"
====== script load redis.call('set', '123456789012', '123') ======
  1000000 requests completed in 20.29 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.3 milliseconds
0.01% <= 0.4 milliseconds
0.16% <= 0.5 milliseconds
1.24% <= 0.6 milliseconds
13.46% <= 0.7 milliseconds
38.77% <= 0.8 milliseconds
54.14% <= 0.9 milliseconds
72.09% <= 1.0 milliseconds
84.90% <= 1.1 milliseconds
92.96% <= 1.2 milliseconds
95.67% <= 1.3 milliseconds
97.57% <= 1.4 milliseconds
99.07% <= 1.5 milliseconds
99.44% <= 1.6 milliseconds
99.57% <= 1.7 milliseconds
99.65% <= 1.8 milliseconds
99.71% <= 1.9 milliseconds
99.75% <= 2 milliseconds
99.92% <= 3 milliseconds
99.95% <= 4 milliseconds
99.97% <= 5 milliseconds
99.98% <= 6 milliseconds
99.99% <= 8 milliseconds
99.99% <= 9 milliseconds
99.99% <= 10 milliseconds
100.00% <= 11 milliseconds
100.00% <= 11 milliseconds
49275.64 requests per second
```
# Test #6 - SET (LUA) with participant-like key and 30 bytes data
```
$ redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789')"
====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789') ======
  1000000 requests completed in 21.15 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.3 milliseconds
0.00% <= 0.4 milliseconds
0.07% <= 0.5 milliseconds
0.48% <= 0.6 milliseconds
5.50% <= 0.7 milliseconds
31.78% <= 0.8 milliseconds
47.76% <= 0.9 milliseconds
65.46% <= 1.0 milliseconds
79.27% <= 1.1 milliseconds
90.28% <= 1.2 milliseconds
94.82% <= 1.3 milliseconds
96.81% <= 1.4 milliseconds
98.41% <= 1.5 milliseconds
99.27% <= 1.6 milliseconds
99.46% <= 1.7 milliseconds
99.56% <= 1.8 milliseconds
99.63% <= 1.9 milliseconds
99.68% <= 2 milliseconds
99.89% <= 3 milliseconds
99.93% <= 4 milliseconds
99.95% <= 5 milliseconds
99.96% <= 6 milliseconds
99.97% <= 7 milliseconds
99.98% <= 8 milliseconds
99.98% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 11 milliseconds
100.00% <= 11 milliseconds
47272.39 requests per second
```
# Test #7 - SET (LUA) with participant-like key and 300 bytes data
```
redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789')"
====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789') ======
  1000000 requests completed in 22.32 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.3 milliseconds
0.00% <= 0.4 milliseconds
0.02% <= 0.5 milliseconds
0.13% <= 0.6 milliseconds
1.12% <= 0.7 milliseconds
19.55% <= 0.8 milliseconds
39.16% <= 0.9 milliseconds
55.47% <= 1.0 milliseconds
71.61% <= 1.1 milliseconds
83.63% <= 1.2 milliseconds
92.43% <= 1.3 milliseconds
95.42% <= 1.4 milliseconds
97.11% <= 1.5 milliseconds
98.49% <= 1.6 milliseconds
99.21% <= 1.7 milliseconds
99.42% <= 1.8 milliseconds
99.53% <= 1.9 milliseconds
99.60% <= 2 milliseconds
99.82% <= 3 milliseconds
99.90% <= 4 milliseconds
99.94% <= 5 milliseconds
99.95% <= 6 milliseconds
99.96% <= 7 milliseconds
99.96% <= 8 milliseconds
99.96% <= 9 milliseconds
99.97% <= 10 milliseconds
99.97% <= 12 milliseconds
99.99% <= 13 milliseconds
99.99% <= 14 milliseconds
100.00% <= 15 milliseconds
100.00% <= 15 milliseconds
44800.86 requests per second
```
# Test #8 - SET (LUA) with participant-like key and 3000 bytes data
```
redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789')"

====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789') ======
  1000000 requests completed in 39.30 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.5 milliseconds
0.00% <= 0.6 milliseconds
0.00% <= 0.7 milliseconds
0.01% <= 0.8 milliseconds
0.03% <= 0.9 milliseconds
0.11% <= 1.0 milliseconds
3.00% <= 1.1 milliseconds
10.50% <= 1.2 milliseconds
15.45% <= 1.3 milliseconds
17.97% <= 1.4 milliseconds
26.95% <= 1.5 milliseconds
36.64% <= 1.6 milliseconds
46.07% <= 1.7 milliseconds
55.40% <= 1.8 milliseconds
65.15% <= 1.9 milliseconds
73.83% <= 2 milliseconds
98.21% <= 3 milliseconds
99.46% <= 4 milliseconds
99.57% <= 5 milliseconds
99.62% <= 6 milliseconds
99.66% <= 7 milliseconds
99.67% <= 8 milliseconds
99.69% <= 9 milliseconds
99.71% <= 10 milliseconds
99.74% <= 11 milliseconds
99.77% <= 12 milliseconds
99.80% <= 13 milliseconds
99.82% <= 14 milliseconds
99.82% <= 15 milliseconds
99.84% <= 16 milliseconds
99.84% <= 17 milliseconds
99.85% <= 18 milliseconds
99.85% <= 23 milliseconds
99.85% <= 24 milliseconds
99.87% <= 25 milliseconds
99.90% <= 26 milliseconds
99.91% <= 27 milliseconds
99.91% <= 28 milliseconds
99.92% <= 29 milliseconds
99.92% <= 30 milliseconds
99.93% <= 54 milliseconds
99.93% <= 55 milliseconds
99.93% <= 56 milliseconds
99.94% <= 57 milliseconds
99.96% <= 58 milliseconds
99.98% <= 59 milliseconds
99.99% <= 60 milliseconds
99.99% <= 61 milliseconds
99.99% <= 62 milliseconds
99.99% <= 63 milliseconds
100.00% <= 64 milliseconds
100.00% <= 64 milliseconds
25445.29 requests per second
```

# Test #9 - SET with random key and 3000 bytes data
```
redis-benchmark -t set -r 10000 -d 3000 -n 1000000
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