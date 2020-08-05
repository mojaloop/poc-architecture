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
  - i3.xlarge (data on EBS)
  - k8s-tanuki-perf1-i3-xl-2
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
  100000 requests completed in 1.21 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.01% <= 0.2 milliseconds
52.19% <= 0.3 milliseconds
93.82% <= 0.4 milliseconds
97.79% <= 0.5 milliseconds
99.17% <= 0.6 milliseconds
99.73% <= 0.7 milliseconds
99.88% <= 0.8 milliseconds
99.90% <= 0.9 milliseconds
99.93% <= 1.0 milliseconds
99.94% <= 1.1 milliseconds
99.95% <= 1.2 milliseconds
99.95% <= 1.3 milliseconds
99.95% <= 1.7 milliseconds
99.95% <= 1.8 milliseconds
99.96% <= 1.9 milliseconds
99.97% <= 2 milliseconds
100.00% <= 2 milliseconds
82850.04 requests per second

====== PING_BULK ======
  100000 requests completed in 1.28 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.95% <= 1 milliseconds
100.00% <= 1 milliseconds
78369.91 requests per second

====== SET ======
  100000 requests completed in 1.28 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.92% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 2 milliseconds
77821.02 requests per second

====== GET ======
  100000 requests completed in 1.26 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

100.00% <= 0 milliseconds
79239.30 requests per second

====== INCR ======
  100000 requests completed in 1.18 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.93% <= 1 milliseconds
100.00% <= 1 milliseconds
84602.37 requests per second

====== LPUSH ======
  100000 requests completed in 1.23 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.79% <= 1 milliseconds
100.00% <= 2 milliseconds
100.00% <= 2 milliseconds
81566.07 requests per second

====== RPUSH ======
  100000 requests completed in 1.22 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.93% <= 1 milliseconds
100.00% <= 1 milliseconds
81699.35 requests per second

====== LPOP ======
  100000 requests completed in 1.17 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.97% <= 1 milliseconds
99.97% <= 2 milliseconds
100.00% <= 2 milliseconds
85689.80 requests per second

====== RPOP ======
  100000 requests completed in 1.22 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.98% <= 1 milliseconds
100.00% <= 1 milliseconds
82304.52 requests per second

====== SADD ======
  100000 requests completed in 1.20 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.99% <= 1 milliseconds
100.00% <= 1 milliseconds
83402.84 requests per second

====== HSET ======
  100000 requests completed in 1.16 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.91% <= 1 milliseconds
100.00% <= 1 milliseconds
86132.64 requests per second

====== SPOP ======
  100000 requests completed in 1.21 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.97% <= 1 milliseconds
100.00% <= 1 milliseconds
82576.38 requests per second

====== LPUSH (needed to benchmark LRANGE) ======
  100000 requests completed in 1.19 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

100.00% <= 1 milliseconds
100.00% <= 1 milliseconds
84317.03 requests per second

====== LRANGE_100 (first 100 elements) ======
  100000 requests completed in 2.20 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

98.79% <= 1 milliseconds
99.98% <= 2 milliseconds
100.00% <= 2 milliseconds
45372.05 requests per second

====== LRANGE_300 (first 300 elements) ======
  100000 requests completed in 6.79 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.62% <= 1 milliseconds
55.22% <= 2 milliseconds
99.75% <= 3 milliseconds
99.87% <= 4 milliseconds
99.90% <= 5 milliseconds
99.94% <= 6 milliseconds
99.97% <= 7 milliseconds
99.98% <= 8 milliseconds
99.99% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 10 milliseconds
14729.71 requests per second

====== LRANGE_500 (first 450 elements) ======
  100000 requests completed in 8.45 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.05% <= 1 milliseconds
57.64% <= 2 milliseconds
97.81% <= 3 milliseconds
99.67% <= 4 milliseconds
99.88% <= 5 milliseconds
99.96% <= 6 milliseconds
99.98% <= 7 milliseconds
99.99% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 9 milliseconds
11839.92 requests per second

====== LRANGE_600 (first 600 elements) ======
  100000 requests completed in 11.17 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.02% <= 1 milliseconds
17.49% <= 2 milliseconds
51.13% <= 3 milliseconds
99.21% <= 4 milliseconds
99.68% <= 5 milliseconds
99.84% <= 6 milliseconds
99.90% <= 7 milliseconds
99.95% <= 8 milliseconds
99.98% <= 9 milliseconds
99.99% <= 10 milliseconds
100.00% <= 11 milliseconds
100.00% <= 11 milliseconds
8950.15 requests per second

====== MSET (10 keys) ======
  100000 requests completed in 1.56 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

93.42% <= 1 milliseconds
99.86% <= 2 milliseconds
99.96% <= 3 milliseconds
99.98% <= 4 milliseconds
100.00% <= 4 milliseconds
64143.68 requests per second
```

# Test #2 - 1M requests (default)
```
redis-benchmark -n 1000000
====== PING_INLINE ======
  1000000 requests completed in 12.21 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.00% <= 0.2 milliseconds
47.52% <= 0.3 milliseconds
94.23% <= 0.4 milliseconds
98.00% <= 0.5 milliseconds
99.26% <= 0.6 milliseconds
99.66% <= 0.7 milliseconds
99.84% <= 0.8 milliseconds
99.89% <= 0.9 milliseconds
99.91% <= 1.0 milliseconds
99.93% <= 1.1 milliseconds
99.95% <= 1.2 milliseconds
99.96% <= 1.3 milliseconds
99.96% <= 1.4 milliseconds
99.96% <= 1.5 milliseconds
99.97% <= 1.6 milliseconds
99.97% <= 1.7 milliseconds
99.97% <= 1.8 milliseconds
99.98% <= 1.9 milliseconds
99.98% <= 2 milliseconds
99.98% <= 3 milliseconds
99.99% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 5 milliseconds
81906.79 requests per second

====== PING_BULK ======
  1000000 requests completed in 12.61 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.95% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 6 milliseconds
100.00% <= 6 milliseconds
79314.72 requests per second

====== SET ======
  1000000 requests completed in 11.98 seconds
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
83465.48 requests per second

====== GET ======
  1000000 requests completed in 12.27 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.94% <= 1 milliseconds
100.00% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 9 milliseconds
81473.03 requests per second

====== INCR ======
  1000000 requests completed in 11.91 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.96% <= 1 milliseconds
100.00% <= 1 milliseconds
83934.87 requests per second

====== LPUSH ======
  1000000 requests completed in 11.88 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.92% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
84160.91 requests per second

====== RPUSH ======
  1000000 requests completed in 11.77 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.94% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 2 milliseconds
84968.98 requests per second

====== LPOP ======
  1000000 requests completed in 12.10 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.91% <= 1 milliseconds
99.98% <= 2 milliseconds
99.99% <= 3 milliseconds
99.99% <= 4 milliseconds
99.99% <= 5 milliseconds
100.00% <= 7 milliseconds
100.00% <= 8 milliseconds
100.00% <= 8 milliseconds
82630.97 requests per second

====== RPOP ======
  1000000 requests completed in 12.08 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.92% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 5 milliseconds
82808.88 requests per second

====== SADD ======
  1000000 requests completed in 12.16 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.94% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 5 milliseconds
82257.14 requests per second

====== HSET ======
  1000000 requests completed in 11.91 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.87% <= 1 milliseconds
99.98% <= 2 milliseconds
99.99% <= 3 milliseconds
99.99% <= 4 milliseconds
100.00% <= 4 milliseconds
83970.10 requests per second

====== SPOP ======
  1000000 requests completed in 12.16 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.91% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 3 milliseconds
82257.14 requests per second

====== LPUSH (needed to benchmark LRANGE) ======
  1000000 requests completed in 11.81 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.96% <= 1 milliseconds
99.99% <= 2 milliseconds
100.00% <= 2 milliseconds
84666.84 requests per second

====== LRANGE_100 (first 100 elements) ======
  1000000 requests completed in 22.60 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

99.03% <= 1 milliseconds
99.93% <= 2 milliseconds
99.97% <= 3 milliseconds
99.99% <= 4 milliseconds
99.99% <= 5 milliseconds
100.00% <= 9 milliseconds
100.00% <= 10 milliseconds
100.00% <= 10 milliseconds
44241.91 requests per second

====== LRANGE_300 (first 300 elements) ======
  1000000 requests completed in 63.30 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.96% <= 1 milliseconds
67.72% <= 2 milliseconds
99.75% <= 3 milliseconds
99.92% <= 4 milliseconds
99.97% <= 5 milliseconds
99.99% <= 6 milliseconds
99.99% <= 7 milliseconds
99.99% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 10 milliseconds
15797.79 requests per second

====== LRANGE_500 (first 450 elements) ======
  1000000 requests completed in 84.49 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.04% <= 1 milliseconds
57.18% <= 2 milliseconds
97.46% <= 3 milliseconds
99.71% <= 4 milliseconds
99.88% <= 5 milliseconds
99.95% <= 6 milliseconds
99.97% <= 7 milliseconds
99.98% <= 8 milliseconds
99.99% <= 9 milliseconds
99.99% <= 10 milliseconds
99.99% <= 11 milliseconds
100.00% <= 12 milliseconds
100.00% <= 13 milliseconds
100.00% <= 14 milliseconds
100.00% <= 14 milliseconds
11835.58 requests per second

====== LRANGE_600 (first 600 elements) ======
  1000000 requests completed in 110.21 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.02% <= 1 milliseconds
20.00% <= 2 milliseconds
53.47% <= 3 milliseconds
99.25% <= 4 milliseconds
99.69% <= 5 milliseconds
99.87% <= 6 milliseconds
99.94% <= 7 milliseconds
99.97% <= 8 milliseconds
99.98% <= 9 milliseconds
99.98% <= 10 milliseconds
99.99% <= 11 milliseconds
99.99% <= 12 milliseconds
100.00% <= 13 milliseconds
100.00% <= 14 milliseconds
100.00% <= 15 milliseconds
100.00% <= 16 milliseconds
100.00% <= 17 milliseconds
9073.67 requests per second

====== MSET (10 keys) ======
  1000000 requests completed in 14.84 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

96.33% <= 1 milliseconds
99.86% <= 2 milliseconds
99.93% <= 3 milliseconds
99.95% <= 4 milliseconds
99.97% <= 5 milliseconds
99.97% <= 6 milliseconds
99.98% <= 7 milliseconds
99.99% <= 8 milliseconds
100.00% <= 9 milliseconds
100.00% <= 9 milliseconds
67385.45 requests per second
```

# Test #3 - just SET (1M, for comparison)
Note this uses single key, next test will use a keyspace...

```
$ redis-benchmark -t set -n 1000000
====== SET ======
  1000000 requests completed in 11.94 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.00% <= 0.2 milliseconds
32.21% <= 0.3 milliseconds
89.12% <= 0.4 milliseconds
96.80% <= 0.5 milliseconds
98.38% <= 0.6 milliseconds
99.29% <= 0.7 milliseconds
99.68% <= 0.8 milliseconds
99.87% <= 0.9 milliseconds
99.93% <= 1.0 milliseconds
99.95% <= 1.1 milliseconds
99.96% <= 1.2 milliseconds
99.97% <= 1.3 milliseconds
99.98% <= 1.4 milliseconds
99.98% <= 1.5 milliseconds
99.99% <= 1.6 milliseconds
99.99% <= 1.7 milliseconds
99.99% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 3 milliseconds
83738.06 requests per second
```

# Test #4 - SET with random key (vs run #3: no significant diff)
```
redis-benchmark -t set -r 10000 -n 1000000
====== SET ======
  1000000 requests completed in 12.28 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.00% <= 0.2 milliseconds
20.39% <= 0.3 milliseconds
82.25% <= 0.4 milliseconds
95.07% <= 0.5 milliseconds
98.05% <= 0.6 milliseconds
99.19% <= 0.7 milliseconds
99.61% <= 0.8 milliseconds
99.83% <= 0.9 milliseconds
99.91% <= 1.0 milliseconds
99.95% <= 1.1 milliseconds
99.97% <= 1.2 milliseconds
99.97% <= 1.3 milliseconds
99.98% <= 1.4 milliseconds
99.98% <= 1.5 milliseconds
99.98% <= 1.6 milliseconds
99.98% <= 1.7 milliseconds
99.98% <= 1.8 milliseconds
99.99% <= 1.9 milliseconds
99.99% <= 2 milliseconds
100.00% <= 3 milliseconds
100.00% <= 4 milliseconds
100.00% <= 4 milliseconds
81419.97 requests per second
```

# Test #5 - SET through LUA script (vs run #3 - no significant diff)

```
redis-benchmark -n 1000000 script load "redis.call('set', '123456789012', '123')"
====== script load redis.call('set', '123456789012', '123') ======
  1000000 requests completed in 12.01 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.00% <= 0.2 milliseconds
21.21% <= 0.3 milliseconds
80.14% <= 0.4 milliseconds
93.38% <= 0.5 milliseconds
96.99% <= 0.6 milliseconds
98.71% <= 0.7 milliseconds
99.39% <= 0.8 milliseconds
99.71% <= 0.9 milliseconds
99.86% <= 1.0 milliseconds
99.92% <= 1.1 milliseconds
99.94% <= 1.2 milliseconds
99.96% <= 1.3 milliseconds
99.97% <= 1.4 milliseconds
99.97% <= 1.5 milliseconds
99.98% <= 1.6 milliseconds
99.98% <= 1.7 milliseconds
99.98% <= 1.8 milliseconds
99.98% <= 2 milliseconds
99.98% <= 3 milliseconds
99.99% <= 4 milliseconds
100.00% <= 5 milliseconds
100.00% <= 5 milliseconds
83263.95 requests per second
```
# Test #6 - SET (LUA) with participant-like key and 30 bytes data
```
redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789')"
====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789') ======
  1000000 requests completed in 12.42 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.01% <= 0.2 milliseconds
14.43% <= 0.3 milliseconds
69.81% <= 0.4 milliseconds
88.66% <= 0.5 milliseconds
95.37% <= 0.6 milliseconds
97.96% <= 0.7 milliseconds
99.08% <= 0.8 milliseconds
99.55% <= 0.9 milliseconds
99.78% <= 1.0 milliseconds
99.87% <= 1.1 milliseconds
99.91% <= 1.2 milliseconds
99.94% <= 1.3 milliseconds
99.95% <= 1.4 milliseconds
99.96% <= 1.5 milliseconds
99.96% <= 1.6 milliseconds
99.96% <= 1.7 milliseconds
99.96% <= 1.8 milliseconds
99.97% <= 1.9 milliseconds
99.97% <= 2 milliseconds
99.98% <= 3 milliseconds
99.99% <= 4 milliseconds
99.99% <= 5 milliseconds
100.00% <= 6 milliseconds
100.00% <= 6 milliseconds
80534.75 requests per second
```

# Test #7 - SET (LUA) with participant-like key and 300 bytes data
```
redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789')"

====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789') ======
  1000000 requests completed in 13.11 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.00% <= 0.2 milliseconds
6.35% <= 0.3 milliseconds
34.23% <= 0.4 milliseconds
63.12% <= 0.5 milliseconds
80.17% <= 0.6 milliseconds
90.29% <= 0.7 milliseconds
95.21% <= 0.8 milliseconds
97.45% <= 0.9 milliseconds
98.56% <= 1.0 milliseconds
98.98% <= 1.1 milliseconds
99.35% <= 1.2 milliseconds
99.65% <= 1.3 milliseconds
99.73% <= 1.4 milliseconds
99.77% <= 1.5 milliseconds
99.80% <= 1.6 milliseconds
99.82% <= 1.7 milliseconds
99.85% <= 1.8 milliseconds
99.87% <= 1.9 milliseconds
99.88% <= 2 milliseconds
99.92% <= 3 milliseconds
99.93% <= 4 milliseconds
99.96% <= 5 milliseconds
99.97% <= 6 milliseconds
99.98% <= 8 milliseconds
99.98% <= 9 milliseconds
99.98% <= 10 milliseconds
99.98% <= 11 milliseconds
99.99% <= 12 milliseconds
99.99% <= 15 milliseconds
100.00% <= 21 milliseconds
100.00% <= 21 milliseconds
76283.47 requests per second
```

# Test #8 - SET (LUA) with participant-like key and 3000 bytes data
```
redis-benchmark -n 1000000 script load "redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789')"

====== script load redis.call('set','participant_123e4567-e89b-12d3-a456-426614174000', '012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789') ======
  1000000 requests completed in 41.98 seconds
  50 parallel clients
  3 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.2 milliseconds
0.00% <= 0.3 milliseconds
0.05% <= 0.4 milliseconds
0.23% <= 0.5 milliseconds
0.71% <= 0.6 milliseconds
3.49% <= 0.7 milliseconds
11.39% <= 0.8 milliseconds
21.42% <= 0.9 milliseconds
40.32% <= 1.0 milliseconds
53.32% <= 1.1 milliseconds
64.55% <= 1.2 milliseconds
75.14% <= 1.3 milliseconds
83.73% <= 1.4 milliseconds
90.47% <= 1.5 milliseconds
94.92% <= 1.6 milliseconds
96.88% <= 1.7 milliseconds
97.75% <= 1.8 milliseconds
98.30% <= 1.9 milliseconds
98.69% <= 2 milliseconds
99.37% <= 3 milliseconds
99.48% <= 4 milliseconds
99.57% <= 5 milliseconds
99.65% <= 6 milliseconds
99.71% <= 7 milliseconds
99.76% <= 8 milliseconds
99.78% <= 9 milliseconds
99.80% <= 10 milliseconds
99.81% <= 11 milliseconds
99.82% <= 12 milliseconds
99.82% <= 13 milliseconds
99.82% <= 14 milliseconds
99.84% <= 15 milliseconds
99.84% <= 17 milliseconds
99.84% <= 18 milliseconds
99.84% <= 19 milliseconds
99.85% <= 20 milliseconds
99.86% <= 21 milliseconds
99.86% <= 22 milliseconds
99.86% <= 23 milliseconds
99.87% <= 24 milliseconds
99.88% <= 25 milliseconds
99.88% <= 26 milliseconds
99.89% <= 27 milliseconds
99.90% <= 28 milliseconds
99.90% <= 31 milliseconds
99.90% <= 32 milliseconds
99.91% <= 34 milliseconds
99.91% <= 35 milliseconds
99.92% <= 36 milliseconds
99.92% <= 37 milliseconds
99.93% <= 38 milliseconds
99.93% <= 39 milliseconds
99.93% <= 40 milliseconds
99.93% <= 45 milliseconds
99.94% <= 46 milliseconds
99.95% <= 50 milliseconds
99.95% <= 51 milliseconds
99.96% <= 67 milliseconds
99.96% <= 68 milliseconds
99.96% <= 69 milliseconds
99.97% <= 80 milliseconds
99.97% <= 140 milliseconds
99.97% <= 141 milliseconds
99.97% <= 149 milliseconds
99.97% <= 150 milliseconds
99.98% <= 1488 milliseconds
99.98% <= 1489 milliseconds
99.98% <= 2820 milliseconds
99.98% <= 2821 milliseconds
99.99% <= 3183 milliseconds
99.99% <= 3184 milliseconds
99.99% <= 3263 milliseconds
99.99% <= 3822 milliseconds
99.99% <= 3823 milliseconds
99.99% <= 3961 milliseconds
99.99% <= 3962 milliseconds
100.00% <= 4640 milliseconds
100.00% <= 4789 milliseconds
100.00% <= 4789 milliseconds
23822.57 requests per second
```

# Test #9 - SET with random key and 3000 bytes data
```
redis-benchmark -t set -r 10000 -d 3000 -n 1000000
====== SET ======
  1000000 requests completed in 23.32 seconds
  50 parallel clients
  3000 bytes payload
  keep alive: 1
  host configuration "save":
  host configuration "appendonly": yes
  multi-thread: no

0.00% <= 0.1 milliseconds
0.00% <= 0.2 milliseconds
3.38% <= 0.3 milliseconds
29.98% <= 0.4 milliseconds
57.12% <= 0.5 milliseconds
75.34% <= 0.6 milliseconds
84.59% <= 0.7 milliseconds
91.46% <= 0.8 milliseconds
94.96% <= 0.9 milliseconds
96.74% <= 1.0 milliseconds
98.05% <= 1.1 milliseconds
98.87% <= 1.2 milliseconds
99.26% <= 1.3 milliseconds
99.44% <= 1.4 milliseconds
99.54% <= 1.5 milliseconds
99.59% <= 1.6 milliseconds
99.62% <= 1.7 milliseconds
99.64% <= 1.8 milliseconds
99.65% <= 1.9 milliseconds
99.66% <= 2 milliseconds
99.71% <= 3 milliseconds
99.73% <= 4 milliseconds
99.75% <= 5 milliseconds
99.78% <= 6 milliseconds
99.80% <= 7 milliseconds
99.81% <= 8 milliseconds
99.82% <= 9 milliseconds
99.83% <= 10 milliseconds
99.83% <= 11 milliseconds
99.83% <= 12 milliseconds
99.85% <= 13 milliseconds
99.86% <= 14 milliseconds
99.87% <= 15 milliseconds
99.87% <= 19 milliseconds
99.87% <= 20 milliseconds
99.88% <= 25 milliseconds
99.88% <= 33 milliseconds
99.89% <= 36 milliseconds
99.89% <= 37 milliseconds
99.90% <= 39 milliseconds
99.90% <= 40 milliseconds
99.91% <= 45 milliseconds
99.91% <= 46 milliseconds
99.91% <= 47 milliseconds
99.92% <= 75 milliseconds
99.92% <= 76 milliseconds
99.93% <= 79 milliseconds
99.93% <= 80 milliseconds
99.93% <= 82 milliseconds
99.93% <= 83 milliseconds
99.94% <= 88 milliseconds
99.94% <= 89 milliseconds
99.94% <= 99 milliseconds
99.94% <= 100 milliseconds
99.95% <= 107 milliseconds
99.95% <= 108 milliseconds
99.96% <= 114 milliseconds
99.96% <= 115 milliseconds
99.96% <= 131 milliseconds
99.96% <= 132 milliseconds
99.96% <= 133 milliseconds
99.96% <= 134 milliseconds
99.97% <= 170 milliseconds
99.97% <= 171 milliseconds
99.97% <= 186 milliseconds
99.97% <= 187 milliseconds
99.97% <= 190 milliseconds
99.97% <= 191 milliseconds
99.98% <= 194 milliseconds
99.98% <= 195 milliseconds
99.98% <= 196 milliseconds
99.98% <= 197 milliseconds
99.98% <= 198 milliseconds
99.99% <= 224 milliseconds
99.99% <= 225 milliseconds
99.99% <= 252 milliseconds
99.99% <= 254 milliseconds
99.99% <= 255 milliseconds
100.00% <= 6227 milliseconds
100.00% <= 6228 milliseconds
100.00% <= 6229 milliseconds
100.00% <= 6229 milliseconds
42879.81 requests per second
```
