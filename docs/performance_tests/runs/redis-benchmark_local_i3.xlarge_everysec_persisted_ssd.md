- [Run details](#run-details)
- [Test #1 - Default benchmark (100k requests)](#test-1---default-benchmark-100k-requests)
- [Test #2 - 1M requests (default)](#test-2---1m-requests-default)
- [Test #3 - just SET (1M, for comparison)](#test-3---just-set-1m-for-comparison)
- [Test #4 - SET with random key (vs run #3: no significant diff)](#test-4---set-with-random-key-vs-run-3-no-significant-diff)
- [Test #5 - SET through LUA script (vs run #3 - no significant diff)](#test-5---set-through-lua-script-vs-run-3---no-significant-diff)
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
      - persistency is set to "appendfsync everysec" by configmap (so, no changes vs file on git)
    - disabled everything else

# Test #1 - Default benchmark (100k requests)

```
$ redis-benchmark
====== PING_INLINE ======
  100000 requests completed in 1.70 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.03% <= 0.3 milliseconds
42.17% <= 0.4 milliseconds
83.19% <= 0.5 milliseconds
96.94% <= 0.6 milliseconds
99.48% <= 0.7 milliseconds
99.86% <= 0.8 milliseconds
99.93% <= 0.9 milliseconds
99.94% <= 1.0 milliseconds
99.95% <= 1.1 milliseconds
99.97% <= 1.2 milliseconds
99.98% <= 1.3 milliseconds
99.99% <= 1.4 milliseconds
99.99% <= 1.5 milliseconds
100.00% <= 1.6 milliseconds
100.00% <= 1.6 milliseconds
58858.15 requests per second

====== PING_BULK ======
  100000 requests completed in 1.51 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.09% <= 0.3 milliseconds
78.47% <= 0.4 milliseconds
90.85% <= 0.5 milliseconds
98.29% <= 0.6 milliseconds
99.44% <= 0.7 milliseconds
99.82% <= 0.8 milliseconds
99.94% <= 0.9 milliseconds
99.99% <= 1.0 milliseconds
100.00% <= 1.1 milliseconds
100.00% <= 1.1 milliseconds
66357.00 requests per second

====== SET ======
  100000 requests completed in 1.50 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.04% <= 0.3 milliseconds
71.86% <= 0.4 milliseconds
89.62% <= 0.5 milliseconds
98.34% <= 0.6 milliseconds
99.16% <= 0.7 milliseconds
99.65% <= 0.8 milliseconds
99.83% <= 0.9 milliseconds
99.90% <= 1.0 milliseconds
99.93% <= 1.1 milliseconds
99.95% <= 1.2 milliseconds
99.95% <= 1.3 milliseconds
99.95% <= 4 milliseconds
99.96% <= 5 milliseconds
100.00% <= 5 milliseconds
66844.91 requests per second

====== GET ======
  100000 requests completed in 1.60 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.76% <= 1 milliseconds
99.97% <= 2 milliseconds
100.00% <= 2 milliseconds
62617.41 requests per second

====== INCR ======
  100000 requests completed in 1.55 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.94% <= 1 milliseconds
99.97% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 3 milliseconds
64557.78 requests per second

====== LPUSH ======
  100000 requests completed in 1.51 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.82% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 2 milliseconds
66006.60 requests per second

====== RPUSH ======
  100000 requests completed in 1.52 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.79% <= 1 milliseconds
100.00% <= 2 milliseconds
100.00% <= 2 milliseconds
65876.16 requests per second

====== LPOP ======
  100000 requests completed in 1.59 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.94% <= 1 milliseconds
100.00% <= 1 milliseconds
62932.66 requests per second

====== RPOP ======
  100000 requests completed in 1.46 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.97% <= 1 milliseconds
100.00% <= 1 milliseconds
68352.70 requests per second

====== SADD ======
  100000 requests completed in 1.66 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.96% <= 1 milliseconds
100.00% <= 1 milliseconds
60060.06 requests per second

====== HSET ======
  100000 requests completed in 1.55 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.86% <= 1 milliseconds
99.95% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 3 milliseconds
64641.24 requests per second

====== SPOP ======
  100000 requests completed in 1.66 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.27% <= 1 milliseconds
99.94% <= 2 milliseconds
99.95% <= 9 milliseconds
99.99% <= 10 milliseconds
100.00% <= 10 milliseconds
60096.15 requests per second

====== LPUSH (needed to benchmark LRANGE) ======
  100000 requests completed in 1.54 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.72% <= 1 milliseconds
100.00% <= 2 milliseconds
100.00% <= 2 milliseconds
64977.26 requests per second

====== LRANGE_100 (first 100 elements) ======
  100000 requests completed in 2.48 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

98.02% <= 1 milliseconds
99.93% <= 2 milliseconds
100.00% <= 2 milliseconds
40257.65 requests per second

====== LRANGE_300 (first 300 elements) ======
  100000 requests completed in 6.49 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.16% <= 1 milliseconds
68.58% <= 2 milliseconds
99.61% <= 3 milliseconds
99.91% <= 4 milliseconds
99.99% <= 5 milliseconds
100.00% <= 5 milliseconds
15401.20 requests per second

====== LRANGE_500 (first 450 elements) ======
  100000 requests completed in 9.34 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.08% <= 1 milliseconds
50.90% <= 2 milliseconds
74.27% <= 3 milliseconds
99.20% <= 4 milliseconds
99.56% <= 5 milliseconds
99.77% <= 6 milliseconds
99.85% <= 7 milliseconds
99.89% <= 8 milliseconds
99.91% <= 9 milliseconds
99.92% <= 10 milliseconds
99.94% <= 11 milliseconds
99.95% <= 12 milliseconds
99.96% <= 13 milliseconds
99.97% <= 14 milliseconds
99.98% <= 15 milliseconds
99.98% <= 16 milliseconds
99.99% <= 17 milliseconds
99.99% <= 18 milliseconds
99.99% <= 19 milliseconds
100.00% <= 20 milliseconds
10712.37 requests per second

====== LRANGE_600 (first 600 elements) ======
  100000 requests completed in 11.48 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.02% <= 1 milliseconds
8.84% <= 2 milliseconds
57.05% <= 3 milliseconds
96.78% <= 4 milliseconds
99.53% <= 5 milliseconds
99.79% <= 6 milliseconds
99.92% <= 7 milliseconds
99.97% <= 8 milliseconds
99.99% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 11 milliseconds
8713.84 requests per second

====== MSET (10 keys) ======
  100000 requests completed in 1.79 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

85.81% <= 1 milliseconds
99.98% <= 2 milliseconds
100.00% <= 2 milliseconds
55772.45 requests per second
```

# Test #2 - 1M requests (default)
```
redis-benchmark -n 1000000
====== PING_INLINE ======
  1000000 requests completed in 16.12 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.00% <= 0.2 milliseconds
0.05% <= 0.3 milliseconds
54.94% <= 0.4 milliseconds
88.44% <= 0.5 milliseconds
97.03% <= 0.6 milliseconds
99.04% <= 0.7 milliseconds
99.55% <= 0.8 milliseconds
99.77% <= 0.9 milliseconds
99.84% <= 1.0 milliseconds
99.87% <= 1.1 milliseconds
99.90% <= 1.2 milliseconds
99.92% <= 1.3 milliseconds
99.93% <= 1.4 milliseconds
99.94% <= 1.5 milliseconds
99.95% <= 1.6 milliseconds
99.96% <= 1.7 milliseconds
99.97% <= 1.8 milliseconds
99.97% <= 1.9 milliseconds
99.98% <= 2 milliseconds
99.98% <= 3 milliseconds
99.99% <= 4 milliseconds
99.99% <= 5 milliseconds
100.00% <= 6 milliseconds
100.00% <= 7 milliseconds
100.00% <= 7 milliseconds
62046.29 requests per second

====== PING_BULK ======
  1000000 requests completed in 15.70 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.81% <= 1 milliseconds
99.97% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
63686.16 requests per second

====== SET ======
  1000000 requests completed in 14.87 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.85% <= 1 milliseconds
99.98% <= 2 milliseconds
99.99% <= 3 milliseconds
99.99% <= 7 milliseconds
100.00% <= 7 milliseconds
67249.50 requests per second

====== GET ======
  1000000 requests completed in 16.02 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.92% <= 1 milliseconds
99.98% <= 2 milliseconds
99.99% <= 3 milliseconds
99.99% <= 7 milliseconds
99.99% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 10 milliseconds
62433.66 requests per second

====== INCR ======
  1000000 requests completed in 15.02 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.83% <= 1 milliseconds
99.98% <= 2 milliseconds
99.98% <= 3 milliseconds
99.99% <= 4 milliseconds
100.00% <= 8 milliseconds
100.00% <= 8 milliseconds
66600.06 requests per second

====== LPUSH ======
  1000000 requests completed in 14.88 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.80% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 3 milliseconds
67217.85 requests per second

====== RPUSH ======
  1000000 requests completed in 14.87 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.89% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
67235.93 requests per second

====== LPOP ======
  1000000 requests completed in 15.08 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.80% <= 1 milliseconds
99.97% <= 2 milliseconds
99.98% <= 3 milliseconds
99.99% <= 4 milliseconds
100.00% <= 7 milliseconds
100.00% <= 7 milliseconds
66304.20 requests per second

====== RPOP ======
  1000000 requests completed in 15.39 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.88% <= 1 milliseconds
99.99% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
64968.81 requests per second

====== SADD ======
  1000000 requests completed in 15.60 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.84% <= 1 milliseconds
99.98% <= 2 milliseconds
100.00% <= 6 milliseconds
100.00% <= 6 milliseconds
64114.89 requests per second

====== HSET ======
  1000000 requests completed in 15.08 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.72% <= 1 milliseconds
99.97% <= 2 milliseconds
99.99% <= 3 milliseconds
99.99% <= 4 milliseconds
99.99% <= 5 milliseconds
100.00% <= 6 milliseconds
100.00% <= 6 milliseconds
66308.60 requests per second

====== SPOP ======
  1000000 requests completed in 15.76 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.86% <= 1 milliseconds
99.98% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 9 milliseconds
63463.86 requests per second

====== LPUSH (needed to benchmark LRANGE) ======
  1000000 requests completed in 15.10 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.82% <= 1 milliseconds
99.98% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
66247.10 requests per second

====== LRANGE_100 (first 100 elements) ======
  1000000 requests completed in 26.80 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

97.50% <= 1 milliseconds
99.92% <= 2 milliseconds
99.99% <= 3 milliseconds
99.99% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 6 milliseconds
37319.00 requests per second

====== LRANGE_300 (first 300 elements) ======
  1000000 requests completed in 70.12 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.11% <= 1 milliseconds
54.51% <= 2 milliseconds
99.60% <= 3 milliseconds
99.87% <= 4 milliseconds
99.95% <= 5 milliseconds
99.97% <= 6 milliseconds
99.98% <= 7 milliseconds
99.99% <= 8 milliseconds
99.99% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 11 milliseconds
100.00% <= 12 milliseconds
100.00% <= 13 milliseconds
100.00% <= 13 milliseconds
14261.47 requests per second

====== LRANGE_500 (first 450 elements) ======
  1000000 requests completed in 96.57 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.03% <= 1 milliseconds
44.02% <= 2 milliseconds
70.34% <= 3 milliseconds
99.42% <= 4 milliseconds
99.73% <= 5 milliseconds
99.88% <= 6 milliseconds
99.94% <= 7 milliseconds
99.96% <= 8 milliseconds
99.98% <= 9 milliseconds
99.99% <= 10 milliseconds
100.00% <= 11 milliseconds
100.00% <= 12 milliseconds
100.00% <= 13 milliseconds
100.00% <= 14 milliseconds
100.00% <= 15 milliseconds
10354.75 requests per second

====== LRANGE_600 (first 600 elements) ======
  1000000 requests completed in 120.37 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.01% <= 1 milliseconds
7.70% <= 2 milliseconds
47.31% <= 3 milliseconds
97.22% <= 4 milliseconds
99.47% <= 5 milliseconds
99.73% <= 6 milliseconds
99.86% <= 7 milliseconds
99.93% <= 8 milliseconds
99.96% <= 9 milliseconds
99.98% <= 10 milliseconds
99.99% <= 11 milliseconds
99.99% <= 12 milliseconds
99.99% <= 13 milliseconds
100.00% <= 14 milliseconds
100.00% <= 15 milliseconds
100.00% <= 16 milliseconds
100.00% <= 16 milliseconds
8307.99 requests per second

====== MSET (10 keys) ======
  1000000 requests completed in 17.09 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

89.82% <= 1 milliseconds
99.89% <= 2 milliseconds
99.97% <= 3 milliseconds
99.98% <= 4 milliseconds
99.99% <= 5 milliseconds
99.99% <= 6 milliseconds
100.00% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 9 milliseconds
58496.64 requests per second
```
# Test #3 - just SET (1M, for comparison)
Note this uses single key, next test will use a keyspace...
```
redis-benchmark -t set -n 1000000
====== SET ======
  1000000 requests completed in 15.13 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.06% <= 0.3 milliseconds
62.79% <= 0.4 milliseconds
84.78% <= 0.5 milliseconds
97.30% <= 0.6 milliseconds
98.89% <= 0.7 milliseconds
99.54% <= 0.8 milliseconds
99.76% <= 0.9 milliseconds
99.87% <= 1.0 milliseconds
99.91% <= 1.1 milliseconds
99.93% <= 1.2 milliseconds
99.94% <= 1.3 milliseconds
99.95% <= 1.4 milliseconds
99.95% <= 1.5 milliseconds
99.96% <= 1.6 milliseconds
99.97% <= 1.7 milliseconds
99.97% <= 1.8 milliseconds
99.98% <= 1.9 milliseconds
99.98% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 5 milliseconds
66085.12 requests per second
```
# Test #4 - SET with random key (vs run #3: no significant diff)
```
redis-benchmark -t set -r 10000 -n 1000000
====== SET ======
  1000000 requests completed in 15.27 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.06% <= 0.3 milliseconds
59.64% <= 0.4 milliseconds
83.12% <= 0.5 milliseconds
96.91% <= 0.6 milliseconds
98.64% <= 0.7 milliseconds
99.39% <= 0.8 milliseconds
99.68% <= 0.9 milliseconds
99.82% <= 1.0 milliseconds
99.88% <= 1.1 milliseconds
99.91% <= 1.2 milliseconds
99.92% <= 1.3 milliseconds
99.93% <= 1.4 milliseconds
99.94% <= 1.5 milliseconds
99.94% <= 1.6 milliseconds
99.95% <= 1.7 milliseconds
99.96% <= 1.8 milliseconds
99.96% <= 1.9 milliseconds
99.97% <= 2 milliseconds
99.98% <= 3 milliseconds
99.99% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 5 milliseconds
65500.75 requests per second
```
# Test #5 - SET through LUA script (vs run #3 - no significant diff)

```
redis-benchmark -n 1000000 script load "redis.call('set', '123456789012', '123')"
====== script load redis.call('set', '123456789012', '123') ======
  1000000 requests completed in 14.89 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.09% <= 0.3 milliseconds
63.05% <= 0.4 milliseconds
83.51% <= 0.5 milliseconds
93.66% <= 0.6 milliseconds
96.97% <= 0.7 milliseconds
98.52% <= 0.8 milliseconds
99.25% <= 0.9 milliseconds
99.62% <= 1.0 milliseconds
99.82% <= 1.1 milliseconds
99.88% <= 1.2 milliseconds
99.91% <= 1.3 milliseconds
99.92% <= 1.4 milliseconds
99.94% <= 1.5 milliseconds
99.95% <= 1.6 milliseconds
99.96% <= 1.7 milliseconds
99.96% <= 1.8 milliseconds
99.97% <= 1.9 milliseconds
99.98% <= 2 milliseconds
99.99% <= 4 milliseconds
100.00% <= 6 milliseconds
100.00% <= 7 milliseconds
100.00% <= 10 milliseconds
100.00% <= 10 milliseconds
67145.64 requests per second
```
# Test #6 - SET (LUA) with participant-like key and 30 bytes data
```
redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789')"
====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789') ======
  1000000 requests completed in 15.41 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.20% <= 0.3 milliseconds
46.42% <= 0.4 milliseconds
72.96% <= 0.5 milliseconds
87.31% <= 0.6 milliseconds
95.30% <= 0.7 milliseconds
98.04% <= 0.8 milliseconds
99.00% <= 0.9 milliseconds
99.54% <= 1.0 milliseconds
99.77% <= 1.1 milliseconds
99.85% <= 1.2 milliseconds
99.89% <= 1.3 milliseconds
99.91% <= 1.4 milliseconds
99.93% <= 1.5 milliseconds
99.94% <= 1.6 milliseconds
99.95% <= 1.7 milliseconds
99.96% <= 1.8 milliseconds
99.96% <= 1.9 milliseconds
99.96% <= 2 milliseconds
99.99% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
64884.51 requests per second
```
# Test #7 - SET (LUA) with participant-like key and 300 bytes data
```
redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789')"
====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789') ======
  1000000 requests completed in 15.60 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.09% <= 0.3 milliseconds
28.46% <= 0.4 milliseconds
62.60% <= 0.5 milliseconds
76.35% <= 0.6 milliseconds
83.58% <= 0.7 milliseconds
89.63% <= 0.8 milliseconds
94.33% <= 0.9 milliseconds
96.46% <= 1.0 milliseconds
98.03% <= 1.1 milliseconds
99.05% <= 1.2 milliseconds
99.45% <= 1.3 milliseconds
99.65% <= 1.4 milliseconds
99.77% <= 1.5 milliseconds
99.82% <= 1.6 milliseconds
99.85% <= 1.7 milliseconds
99.87% <= 1.8 milliseconds
99.89% <= 1.9 milliseconds
99.90% <= 2 milliseconds
99.96% <= 3 milliseconds
99.97% <= 4 milliseconds
99.98% <= 5 milliseconds
99.99% <= 6 milliseconds
100.00% <= 6 milliseconds
64094.35 requests per second
```
# Test #8 - SET (LUA) with participant-like key and 3000 bytes data
```
redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789')"

====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789') ======
  1000000 requests completed in 30.02 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.3 milliseconds
0.01% <= 0.4 milliseconds
0.06% <= 0.5 milliseconds
0.33% <= 0.6 milliseconds
1.89% <= 0.7 milliseconds
5.66% <= 0.8 milliseconds
13.62% <= 0.9 milliseconds
21.22% <= 1.0 milliseconds
28.82% <= 1.1 milliseconds
46.33% <= 1.2 milliseconds
56.98% <= 1.3 milliseconds
65.38% <= 1.4 milliseconds
73.44% <= 1.5 milliseconds
80.27% <= 1.6 milliseconds
86.20% <= 1.7 milliseconds
91.43% <= 1.8 milliseconds
95.06% <= 1.9 milliseconds
96.51% <= 2 milliseconds
99.19% <= 3 milliseconds
99.45% <= 4 milliseconds
99.54% <= 5 milliseconds
99.59% <= 6 milliseconds
99.64% <= 7 milliseconds
99.68% <= 8 milliseconds
99.72% <= 9 milliseconds
99.74% <= 10 milliseconds
99.75% <= 11 milliseconds
99.77% <= 12 milliseconds
99.79% <= 13 milliseconds
99.79% <= 14 milliseconds
99.80% <= 15 milliseconds
99.82% <= 16 milliseconds
99.83% <= 17 milliseconds
99.84% <= 18 milliseconds
99.85% <= 19 milliseconds
99.85% <= 20 milliseconds
99.86% <= 21 milliseconds
99.87% <= 22 milliseconds
99.88% <= 23 milliseconds
99.89% <= 24 milliseconds
99.90% <= 25 milliseconds
99.91% <= 26 milliseconds
99.93% <= 27 milliseconds
99.95% <= 28 milliseconds
99.95% <= 29 milliseconds
99.96% <= 30 milliseconds
99.96% <= 31 milliseconds
99.97% <= 34 milliseconds
99.97% <= 35 milliseconds
99.97% <= 36 milliseconds
99.98% <= 37 milliseconds
99.99% <= 38 milliseconds
100.00% <= 39 milliseconds
100.00% <= 39 milliseconds
33308.91 requests per second
```
# Test #9 - SET with random key and 3000 bytes data
```
redis-benchmark -t set -r 10000 -d 3000 -n 1000000
====== SET ======
  1000000 requests completed in 22.11 seconds
  50 parallel clients
  3000 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.02% <= 0.3 milliseconds
1.75% <= 0.4 milliseconds
11.25% <= 0.5 milliseconds
28.03% <= 0.6 milliseconds
43.74% <= 0.7 milliseconds
55.15% <= 0.8 milliseconds
65.64% <= 0.9 milliseconds
77.74% <= 1.0 milliseconds
84.30% <= 1.1 milliseconds
88.87% <= 1.2 milliseconds
92.52% <= 1.3 milliseconds
95.14% <= 1.4 milliseconds
96.78% <= 1.5 milliseconds
97.64% <= 1.6 milliseconds
98.23% <= 1.7 milliseconds
98.67% <= 1.8 milliseconds
98.95% <= 1.9 milliseconds
99.10% <= 2 milliseconds
99.51% <= 3 milliseconds
99.60% <= 4 milliseconds
99.64% <= 5 milliseconds
99.68% <= 6 milliseconds
99.72% <= 7 milliseconds
99.74% <= 8 milliseconds
99.75% <= 9 milliseconds
99.76% <= 10 milliseconds
99.78% <= 11 milliseconds
99.78% <= 12 milliseconds
99.79% <= 13 milliseconds
99.80% <= 14 milliseconds
99.82% <= 15 milliseconds
99.84% <= 16 milliseconds
99.85% <= 18 milliseconds
99.85% <= 19 milliseconds
99.85% <= 23 milliseconds
99.85% <= 24 milliseconds
99.86% <= 26 milliseconds
99.86% <= 27 milliseconds
99.87% <= 28 milliseconds
99.87% <= 29 milliseconds
99.87% <= 30 milliseconds
99.88% <= 35 milliseconds
99.88% <= 36 milliseconds
99.88% <= 37 milliseconds
99.89% <= 38 milliseconds
99.89% <= 39 milliseconds
99.90% <= 44 milliseconds
99.90% <= 45 milliseconds
99.90% <= 46 milliseconds
99.91% <= 47 milliseconds
99.91% <= 48 milliseconds
99.91% <= 49 milliseconds
99.92% <= 53 milliseconds
99.92% <= 54 milliseconds
99.92% <= 55 milliseconds
99.93% <= 56 milliseconds
99.93% <= 57 milliseconds
99.94% <= 58 milliseconds
99.94% <= 59 milliseconds
99.94% <= 60 milliseconds
99.95% <= 61 milliseconds
99.96% <= 62 milliseconds
99.98% <= 63 milliseconds
99.98% <= 64 milliseconds
99.98% <= 65 milliseconds
99.99% <= 66 milliseconds
99.99% <= 69 milliseconds
99.99% <= 70 milliseconds
100.00% <= 71 milliseconds
100.00% <= 72 milliseconds
100.00% <= 72 milliseconds
45228.40 requests per second
```
