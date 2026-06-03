<?php

namespace Database\Seeders;

use App\Models\SeFlashcard;
use App\Models\SePrompt;
use Illuminate\Database\Seeder;

class SeSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedPrompts();
        $this->seedFlashcards();
    }

    private function seedPrompts(): void
    {
        $prompts = [
            // ── System Design (4) ──
            [
                'title'       => 'Design a URL Shortener',
                'category'    => 'system-design',
                'difficulty'  => 'junior',
                'mode'        => 'both',
                'target_words'=> 250,
                'target_seconds' => 120,
                'description' => 'Design a URL shortening service like bit.ly. Users should be able to submit a long URL and receive a short code that redirects to the original.',
                'context'     => 'Assume 10M URLs stored, read-heavy with ~100:1 read-to-write ratio. No custom domain requirement initially.',
                'key_concepts'=> ['short code generation (hash vs counter)', 'data model (mapping table)', 'read path (cache + DB)', 'redirect (HTTP 301 vs 302)', 'storage estimation'],
                'framework_hints' => ['Start with the data model', 'Explain how you generate unique short codes', 'Describe the read and write paths separately', 'Discuss caching strategy'],
            ],
            [
                'title'       => 'Design an API Rate Limiter',
                'category'    => 'system-design',
                'difficulty'  => 'mid',
                'mode'        => 'both',
                'target_words'=> 300,
                'target_seconds' => 120,
                'description' => 'Design a rate limiting service that can throttle API requests per user, per endpoint, and globally. The service should be distributed and work across multiple API gateway instances.',
                'context'     => 'The API receives ~50k requests/second globally. Rate limits: 1000 req/min per user, 100 req/min per endpoint per user.',
                'key_concepts'=> ['token bucket algorithm', 'sliding window counter', 'Redis for distributed state', 'race conditions', 'local vs global rate limiting', 'HTTP 429 response'],
                'framework_hints' => ['Choose and justify your algorithm (token bucket vs leaky bucket vs sliding window)', 'Explain how distributed coordination works', 'Discuss failure modes (what if Redis is down?)'],
            ],
            [
                'title'       => 'Design a Real-Time Notification System',
                'category'    => 'system-design',
                'difficulty'  => 'senior',
                'mode'        => 'both',
                'target_words'=> 400,
                'target_seconds' => 120,
                'description' => 'Design a real-time notification system that can deliver push notifications, in-app alerts, and emails to millions of users. Support multiple channels and delivery guarantees.',
                'context'     => '500M active users, 10M notifications/day. Requirements: at-least-once delivery, user preferences for channels, notification history.',
                'key_concepts'=> ['fan-out strategies (push vs pull)', 'message queues for async delivery', 'idempotency', 'delivery tracking', 'user preference service', 'backpressure'],
                'framework_hints' => ['Separate notification creation from delivery', 'Discuss fan-out patterns and when to use each', 'Address delivery guarantees and retry logic'],
            ],
            [
                'title'       => 'Design a Distributed Cache',
                'category'    => 'system-design',
                'difficulty'  => 'senior',
                'mode'        => 'both',
                'target_words'=> 400,
                'target_seconds' => 120,
                'description' => 'Design a distributed caching system like Memcached or Redis Cluster. Support get, set, delete operations with configurable TTL. The system must scale horizontally.',
                'context'     => 'Target: sub-millisecond latency at p99, 99.9% availability, horizontal scaling to petabytes.',
                'key_concepts'=> ['consistent hashing for data distribution', 'cache eviction policies (LRU, LFU)', 'replication for availability', 'cache invalidation strategies', 'hot key problem', 'thundering herd'],
                'framework_hints' => ['Start with a single-node design, then scale out', 'Explain how you partition data across nodes', 'Address rebalancing when nodes join/leave'],
            ],

            // ── Architecture (4) ──
            [
                'title'       => 'Monolith vs Microservices: When to Choose Each',
                'category'    => 'architecture',
                'difficulty'  => 'mid',
                'mode'        => 'both',
                'target_words'=> 300,
                'target_seconds' => 120,
                'description' => 'You are joining a startup with 3 engineers and a working monolith at 50k users. The CTO wants to "move to microservices." How do you evaluate this decision and what do you recommend?',
                'context'     => null,
                'key_concepts'=> ['team size and cognitive load', 'deployment complexity', 'distributed systems failure modes', 'service boundaries', 'data consistency across services', 'strangler fig pattern'],
                'framework_hints' => ['Identify the real pain the team is experiencing', 'List the actual costs of each approach at this scale', 'Propose a concrete recommendation with conditions'],
            ],
            [
                'title'       => 'Design an Event-Driven Order Processing System',
                'category'    => 'architecture',
                'difficulty'  => 'senior',
                'mode'        => 'both',
                'target_words'=> 400,
                'target_seconds' => 120,
                'description' => 'Design the order processing architecture for an e-commerce platform. Orders must go through: payment, inventory reservation, fulfillment, and notification steps. Design for resilience and consistency.',
                'context'     => '50k orders/day, each order touches 4+ services. Requirement: an order must not be charged without inventory reservation succeeding.',
                'key_concepts'=> ['Saga pattern (choreography vs orchestration)', 'compensating transactions', 'idempotency keys', 'event sourcing for audit', 'at-least-once delivery', 'outbox pattern'],
                'framework_hints' => ['Draw the event flow for the happy path first', 'Then walk through each failure scenario', 'Explain how you ensure money is not charged without inventory'],
            ],
            [
                'title'       => 'CQRS: What It Is and When to Use It',
                'category'    => 'architecture',
                'difficulty'  => 'senior',
                'mode'        => 'writing',
                'target_words'=> 350,
                'target_seconds' => 120,
                'description' => 'Explain the CQRS (Command Query Responsibility Segregation) pattern. When does it make sense to use it, and what are the real trade-offs? Give a concrete example of a system where you would apply it.',
                'context'     => null,
                'key_concepts'=> ['read model vs write model separation', 'eventual consistency', 'event sourcing as complement', 'complexity cost', 'read scalability', 'use case fit'],
                'framework_hints' => ['Define clearly before evaluating', 'Show you understand the consistency trade-off', 'Give a specific system example with justification'],
            ],
            [
                'title'       => 'Multi-Tenant SaaS Architecture',
                'category'    => 'architecture',
                'difficulty'  => 'staff',
                'mode'        => 'both',
                'target_words'=> 450,
                'target_seconds' => 120,
                'description' => 'Design the data isolation strategy for a multi-tenant SaaS product. Evaluate and choose between: shared schema (row-level isolation), shared database with separate schemas, or separate databases per tenant.',
                'context'     => '10k tenants, ranging from 10 to 50k users each. Some enterprise tenants require data residency in specific regions. SLAs vary: most are standard, top 5% are premium with 99.99% uptime.',
                'key_concepts'=> ['tenant isolation models and trade-offs', 'connection pooling at scale', 'schema-per-tenant migration complexity', 'query performance with row-level security', 'regulatory compliance (GDPR, data residency)', 'noisy neighbour problem'],
                'framework_hints' => ['Start with the isolation model trade-offs matrix', 'Explain how premium vs standard tenants change your decision', 'Address migration complexity honestly'],
            ],

            // ── Use Cases (3) ──
            [
                'title'       => 'Write Use Cases for a User Authentication System',
                'category'    => 'use-cases',
                'difficulty'  => 'junior',
                'mode'        => 'writing',
                'target_words'=> 250,
                'target_seconds' => 120,
                'description' => 'Write structured use cases for a user authentication system that supports: email/password login, OAuth (Google), and two-factor authentication (TOTP). Include the main flow, alternative flows, and error conditions.',
                'context'     => null,
                'key_concepts'=> ['use case structure (actor, precondition, main flow, alternatives)', 'happy path vs error paths', 'actors (user, system, OAuth provider)', 'session management', '2FA fallback flow'],
                'framework_hints' => ['Use structured format: Actor, Precondition, Main Flow, Alternative Flows, Postcondition', 'Cover at minimum: login, failed login, 2FA challenge', 'Think about edge cases: expired tokens, locked accounts'],
            ],
            [
                'title'       => 'Requirements for a Social Media News Feed',
                'category'    => 'use-cases',
                'difficulty'  => 'mid',
                'mode'        => 'writing',
                'target_words'=> 300,
                'target_seconds' => 120,
                'description' => 'Write functional and non-functional requirements for a social media news feed (like Twitter/X home timeline). Include both what the system must do and performance/reliability targets.',
                'context'     => null,
                'key_concepts'=> ['functional vs non-functional requirements', 'feed freshness vs latency trade-off', 'ranking and filtering requirements', 'pagination and infinite scroll', 'scalability targets (DAU, posts/day)', 'content moderation requirements'],
                'framework_hints' => ['Separate functional and non-functional clearly', 'Include explicit numbers for scale (DAU, latency targets)', 'List what is out of scope to show scoping skill'],
            ],
            [
                'title'       => 'Database Selection Trade-offs for an E-commerce Platform',
                'category'    => 'use-cases',
                'difficulty'  => 'mid',
                'mode'        => 'both',
                'target_words'=> 300,
                'target_seconds' => 120,
                'description' => 'You are building an e-commerce platform. Walk through the data storage decisions for: product catalog, user orders, inventory, and search. Justify your database choices for each.',
                'context'     => 'Scale: 1M products, 100k orders/day, global users. Requirement: inventory updates must be strongly consistent.',
                'key_concepts'=> ['relational vs document vs search store trade-offs', 'strong consistency for inventory', 'Elasticsearch/Typesense for product search', 'read replicas for catalog', 'ACID for orders', 'polyglot persistence'],
                'framework_hints' => ['Go entity by entity, not database by database', 'State your consistency requirement before choosing', 'Explain why you rejected the alternatives'],
            ],

            // ── Real-World (4) ──
            [
                'title'       => 'API Latency Spiked 10× — Incident Response Walkthrough',
                'category'    => 'real-world',
                'difficulty'  => 'mid',
                'mode'        => 'both',
                'target_words'=> 300,
                'target_seconds' => 120,
                'description' => "It's 2am. PagerDuty fires: API p99 latency jumped from 120ms to 1.4s. Error rate is elevated but not catastrophic. Walk through your incident response: how do you diagnose and resolve this?",
                'context'     => 'You have access to: APM traces, database slow query logs, infrastructure metrics (CPU, memory, connections), and recent deploys.',
                'key_concepts'=> ['incident response process (observe, diagnose, mitigate, resolve)', 'structured diagnosis (eliminate hypotheses)', 'common causes: N+1 queries, lock contention, external dependency, memory pressure', 'mitigation first vs root cause first', 'post-mortem structure'],
                'framework_hints' => ['Walk through your mental model: what are the possible causes?', 'Explain what you look at first and why', 'Describe the communication you do while diagnosing'],
            ],
            [
                'title'       => 'Zero-Downtime Monolith to Microservices Migration',
                'category'    => 'real-world',
                'difficulty'  => 'senior',
                'mode'        => 'both',
                'target_words'=> 400,
                'target_seconds' => 120,
                'description' => 'Your team owns a 6-year-old Rails monolith serving 2M users. The business wants to extract the billing service into a standalone microservice, with zero downtime. Walk through your migration strategy.',
                'context'     => 'The billing module currently handles: subscription management, invoice generation, payment processing, and financial reporting. It shares the monolith database.',
                'key_concepts'=> ['strangler fig pattern', 'parallel run (dual-write)', 'data migration strategy', 'feature flags for cutover', 'rollback plan', 'API contract first', 'shared database anti-pattern resolution'],
                'framework_hints' => ['Start with API contract definition before touching code', 'Explain the dual-write phase and why it is necessary', 'Describe your rollback trigger and rollback plan'],
            ],
            [
                'title'       => 'Production Database at 95% Disk — What Do You Do?',
                'category'    => 'real-world',
                'difficulty'  => 'mid',
                'mode'        => 'speaking',
                'target_words'=> 300,
                'target_seconds' => 180,
                'description' => 'Your production Postgres database has hit 95% disk usage. Writes are starting to fail intermittently. You have ~2 hours before it fills completely. Walk through your response.',
                'context'     => null,
                'key_concepts'=> ['immediate triage vs root cause', 'identifying disk consumers (VACUUM bloat, logs, large tables)', 'safe emergency space recovery', 'pg_bloat, pg_relation_size', 'WAL archiving', 'escalation and communication'],
                'framework_hints' => ['Buy time first before diagnosing', 'Explain how you find where disk is used', 'Describe your communication to stakeholders while working'],
            ],
            [
                'title'       => "Designing for 1M Users When You're at 10k",
                'category'    => 'real-world',
                'difficulty'  => 'senior',
                'mode'        => 'both',
                'target_words'=> 400,
                'target_seconds' => 120,
                'description' => 'Your product just went viral. You have 10k users today and a realistic path to 1M in 3 months. Your current stack is a single Postgres instance and two app servers. What do you do, and in what order?',
                'context'     => 'Budget is constrained — you cannot rewrite everything. You need to prioritise.',
                'key_concepts'=> ["identifying actual bottlenecks (measure, don't guess)", 'read replicas before sharding', 'connection pooling (PgBouncer)', 'CDN for static assets', 'async job queues', 'horizontal app server scaling', 'premature optimisation traps'],
                'framework_hints' => ['Instrument first — identify where the bottleneck actually is', 'Rank changes by impact vs effort', 'Be explicit about what NOT to do yet and why'],
            ],
        ];

        foreach ($prompts as $p) {
            SePrompt::updateOrCreate(['title' => $p['title']], $p);
        }
    }

    private function seedFlashcards(): void
    {
        $cards = [
            ['concept' => 'CAP Theorem', 'category' => 'distributed-systems', 'front' => 'What does the CAP Theorem state, and what does it mean in practice?', 'back' => 'A distributed system can guarantee at most two of: Consistency (every read sees the latest write), Availability (every request receives a response), and Partition Tolerance (system continues despite network partitions). Since partitions are unavoidable in real networks, you must choose between CP or AP.', 'example' => 'Zookeeper/etcd choose CP — they reject writes during partitions. DynamoDB chooses AP — it accepts writes and reconciles later.', 'gotcha' => 'You cannot choose CA in a real distributed system — network partitions always happen. The real choice is CP vs AP.'],
            ['concept' => 'ACID Properties', 'category' => 'databases', 'front' => 'What are the ACID properties of database transactions?', 'back' => 'Atomicity (all-or-nothing), Consistency (data always valid per rules), Isolation (concurrent transactions don\'t see each other\'s partial state), Durability (committed data survives crashes). These are guarantees relational databases provide for reliable transactions.', 'example' => 'A bank transfer: debit one account and credit another. ACID ensures both happen or neither does, even if the server crashes mid-way.', 'gotcha' => '"Consistency" in ACID means database invariants hold — it\'s different from the C in CAP (which means linearizability).'],
            ['concept' => 'BASE Properties', 'category' => 'databases', 'front' => 'What does BASE mean, and how does it contrast with ACID?', 'back' => 'Basically Available (system responds even if data may be stale), Soft state (data may change without input as eventual consistency settles), Eventually Consistent (given no new updates, all replicas converge). BASE systems trade strong consistency for availability and performance.', 'example' => 'Amazon shopping cart: adding items is always accepted (BA), cart state may differ across regions temporarily (SS), but eventually all nodes agree (EC).', 'gotcha' => 'Eventually consistent does not mean "inconsistent forever" — it means convergence given time and no new updates.'],
            ['concept' => 'Eventual Consistency', 'category' => 'distributed-systems', 'front' => 'What is eventual consistency, and what are its practical implications?', 'back' => 'In an eventually consistent system, given no new updates, all replicas will converge to the same value. Reads may return stale data during the convergence window. Systems must handle conflicts (e.g. last-write-wins, CRDTs) and clients must tolerate brief inconsistency.', 'example' => 'DNS propagation: after updating a DNS record, different servers return different IPs for minutes/hours before converging.', 'gotcha' => 'The time to convergence varies wildly — milliseconds in some systems, minutes or hours in others. "Eventually" is not a latency guarantee.'],
            ['concept' => 'CQRS', 'category' => 'architecture', 'front' => 'What is CQRS and when should you use it?', 'back' => 'Command Query Responsibility Segregation: separate your write model (commands that mutate state) from your read model (queries that return data). The read model is often a denormalised projection optimised for specific query patterns. Useful when read and write workloads have very different shapes.', 'example' => 'An order system writes normalised orders to Postgres, but projects denormalised order summaries into Elasticsearch for fast customer-facing queries.', 'gotcha' => 'CQRS adds significant complexity — separate models, synchronisation lag, eventual consistency between models. Don\'t add it unless you have clear read/write asymmetry.'],
            ['concept' => 'Event Sourcing', 'category' => 'architecture', 'front' => 'What is event sourcing and how does it differ from traditional CRUD?', 'back' => 'Instead of storing current state, event sourcing stores a log of all events that led to that state. Current state is derived by replaying the event log. Benefits: complete audit trail, ability to replay history, temporal queries. Often paired with CQRS.', 'example' => 'A bank account: instead of storing balance = $500, store [Deposit $1000, Withdrawal $300, Withdrawal $200]. Balance is computed by summing events.', 'gotcha' => 'Event schemas must be versioned carefully — replaying old events with new code is hard. Snapshots are needed for performance when event logs grow large.'],
            ['concept' => 'Saga Pattern', 'category' => 'distributed-systems', 'front' => 'What is the Saga pattern, and what are the two implementation styles?', 'back' => 'A Saga is a sequence of local transactions that span multiple services, with compensating transactions to undo completed steps if a later step fails. Choreography: services react to events (no central coordinator). Orchestration: a central orchestrator tells services what to do next.', 'example' => 'Order processing saga: payment → inventory reservation → fulfillment. If inventory fails, a compensating transaction refunds the payment.', 'gotcha' => 'Sagas provide ACD without Isolation — two concurrent sagas may read each other\'s intermediate state. Design around this carefully.'],
            ['concept' => 'Two-Phase Commit (2PC)', 'category' => 'distributed-systems', 'front' => 'How does Two-Phase Commit work and why is it rarely used in modern systems?', 'back' => 'Phase 1 (Prepare): coordinator asks all participants to prepare and lock resources, respond yes/no. Phase 2 (Commit): if all said yes, coordinator sends commit; otherwise sends abort. Guarantees atomicity across distributed nodes but: blocks on coordinator failure, reduces availability, poor performance.', 'example' => 'Traditional XA transactions in databases: two databases both prepare, coordinator commits both atomically.', 'gotcha' => '2PC can block indefinitely if the coordinator crashes between phases — participants hold locks and cannot proceed. This is why Sagas are preferred in modern microservices.'],
            ['concept' => 'Circuit Breaker', 'category' => 'resilience', 'front' => 'What is the circuit breaker pattern and when does it apply?', 'back' => 'A circuit breaker wraps calls to an external service and monitors failures. States: Closed (normal), Open (failing fast after threshold), Half-Open (testing recovery). When open, it immediately returns an error instead of waiting for a timeout, preventing cascading failures.', 'example' => 'Payment service circuit breaker: if 5 consecutive calls fail in 10 seconds, open the circuit for 30 seconds. During that window, return "payment unavailable" instantly.', 'gotcha' => 'Circuit breakers need per-dependency tuning — thresholds, timeout windows, and reset strategies vary by service SLA.'],
            ['concept' => 'Token Bucket (Rate Limiting)', 'category' => 'rate-limiting', 'front' => 'How does the token bucket algorithm work for rate limiting?', 'back' => 'A bucket holds up to N tokens. Tokens are added at a fixed rate (e.g. 10/second). Each request consumes one token. If the bucket is empty, the request is rejected. Allows bursting up to bucket capacity while enforcing an average rate.', 'example' => 'API limit: 100 tokens/bucket, refills 10 tokens/second. A user can burst 100 requests instantly, then is limited to 10/second.', 'gotcha' => 'In distributed systems, the bucket state must be stored centrally (e.g. Redis) to enforce limits across multiple servers — local buckets allow N × rate through.'],
            ['concept' => 'Leaky Bucket (Rate Limiting)', 'category' => 'rate-limiting', 'front' => 'How does the leaky bucket algorithm differ from token bucket?', 'back' => 'Requests enter a queue (the "bucket"). The queue is processed at a fixed rate (the "leak"). If the bucket overflows, excess requests are dropped. Unlike token bucket, it produces a smooth, constant output rate — no bursting allowed.', 'example' => 'Traffic shaping: even if 100 requests arrive at once, they are queued and processed at 10/second. The first request is not delayed, but the 11th waits 1 second.', 'gotcha' => 'Leaky bucket is better for output rate smoothing but worse for bursty workloads — it adds latency to burst requests rather than accepting them immediately.'],
            ['concept' => 'Consistent Hashing', 'category' => 'distributed-systems', 'front' => 'What problem does consistent hashing solve and how does it work?', 'back' => 'Traditional modulo hashing remaps almost all keys when nodes are added/removed. Consistent hashing places both nodes and keys on a ring. Each key is assigned to the nearest node clockwise. Adding/removing a node only reassigns keys from/to its immediate neighbor — O(K/N) instead of O(K).', 'example' => 'Redis Cluster uses consistent hashing: adding a 5th shard only moves ~20% of keys, not all of them.', 'gotcha' => 'Naive consistent hashing creates hotspots when nodes are unevenly distributed. Virtual nodes (vnodes) — each physical node owns multiple ring positions — solve this.'],
            ['concept' => 'Database Sharding', 'category' => 'databases', 'front' => 'What is database sharding and what are the main strategies?', 'back' => 'Sharding splits a dataset across multiple database instances (shards). Strategies: horizontal (rows split by shard key), range-based (key ranges per shard), hash-based (hash(key) % N). Enables horizontal scale beyond a single node.', 'example' => 'User data sharded by user_id % 8: user 1 → shard 1, user 9 → shard 1, user 2 → shard 2.', 'gotcha' => 'Cross-shard joins and transactions are extremely expensive. Choose your shard key to keep related data on the same shard. Resharding is painful — plan capacity ahead.'],
            ['concept' => 'Vertical vs Horizontal Scaling', 'category' => 'scalability', 'front' => 'What is the difference between vertical and horizontal scaling, and when does each apply?', 'back' => 'Vertical scaling (scale up): add more CPU/RAM/disk to existing servers. Simple, no code changes, but has a ceiling and single point of failure. Horizontal scaling (scale out): add more servers, distribute load. No ceiling, high availability, but requires stateless design or distributed state management.', 'example' => 'Vertical: upgrading Postgres from 32GB to 128GB RAM. Horizontal: adding 3 app server replicas behind a load balancer.', 'gotcha' => 'Most systems hit vertical limits before they exhaust horizontal potential. But horizontal scaling requires stateless application design — session data cannot live on individual servers.'],
            ['concept' => 'Load Balancing Strategies', 'category' => 'infrastructure', 'front' => 'Compare round-robin and least-connections load balancing. When does each apply?', 'back' => 'Round-robin: distribute requests in order — simple, works well when requests are homogeneous and servers are identical. Least-connections: route to the server with fewest active connections — better for heterogeneous requests with variable processing time.', 'example' => 'Round-robin for static file serving (fast, uniform). Least-connections for API with mixed short and long-running requests.', 'gotcha' => 'Round-robin fails when requests have very different processing times — one slow endpoint can saturate one server while others are idle. Least-connections handles this naturally.'],
            ['concept' => 'SQL vs NoSQL', 'category' => 'databases', 'front' => 'How do you decide between SQL and NoSQL for a given use case?', 'back' => 'SQL: structured data with relationships, complex queries, ACID transactions, schema enforced. NoSQL: flexible schema, document/key-value/graph/time-series shapes, horizontal scale, eventual consistency. Neither is universally better — match the data model and access pattern.', 'example' => 'SQL for financial transactions (ACID required). MongoDB for user-generated content with varying fields. Redis for session storage (key-value, fast).', 'gotcha' => '"NoSQL scales, SQL doesn\'t" is a myth. Postgres scales very far with read replicas and proper indexing. Choose based on data model fit, not a scalability assumption.'],
            ['concept' => 'Message Queue vs Synchronous Call', 'category' => 'architecture', 'front' => 'When should you use a message queue instead of a synchronous API call between services?', 'back' => 'Use a queue when: the consumer can process later (async acceptable), you need buffering for spiky load, you want loose coupling, or the operation is long-running. Use synchronous when: the caller needs an immediate result, or the operation is short and latency matters.', 'example' => 'Payment confirmation: synchronous (user waits). Sending welcome email after signup: async queue (user doesn\'t wait).', 'gotcha' => 'Queues introduce complexity: message ordering, idempotency, dead-letter queues, consumer lag monitoring. Don\'t add a queue just to decouple — only if async is genuinely acceptable.'],
            ['concept' => 'Idempotency', 'category' => 'distributed-systems', 'front' => 'What does idempotency mean in API design, and why does it matter?', 'back' => 'An operation is idempotent if calling it multiple times produces the same result as calling it once. GET, PUT, DELETE are idempotent by design. POST is not. Critical for retries in distributed systems: if a request times out, the client can safely retry an idempotent operation.', 'example' => 'Payment retry: if the charge request times out, was it applied? Use an idempotency key — same key = same result, no double charge.', 'gotcha' => 'Idempotency must be enforced server-side — the client cannot make an operation idempotent. The server must check if the idempotency key was already processed.'],
            ['concept' => 'Service Discovery', 'category' => 'infrastructure', 'front' => 'What is service discovery and what are the two main approaches?', 'back' => 'Service discovery lets services find each other\'s network location dynamically. Client-side: each service queries a service registry (e.g. Eureka) and load-balances itself. Server-side: a load balancer/proxy queries the registry and routes — service is unaware of others.', 'example' => 'Kubernetes uses server-side discovery: kube-proxy intercepts traffic and routes to healthy pods via kube-dns, transparent to the calling service.', 'gotcha' => 'Hardcoded IP addresses in config files are the failure mode service discovery solves. Services can scale or fail and restart on different IPs at any time.'],
            ['concept' => 'API Gateway', 'category' => 'architecture', 'front' => 'What is an API Gateway and what concerns belong there?', 'back' => 'An API gateway is the single entry point for external clients to backend services. It handles: routing, authentication/authorization, rate limiting, SSL termination, request transformation, logging, and sometimes caching. It encapsulates internal service topology from clients.', 'example' => 'AWS API Gateway: clients call /api/orders → gateway authenticates JWT, rate-limits by key, and proxies to the Orders microservice.', 'gotcha' => 'Don\'t put business logic in the API gateway — it becomes a bottleneck and the logic is invisible. Keep it for cross-cutting concerns only.'],
            ['concept' => 'Cache Aside Pattern', 'category' => 'caching', 'front' => 'How does the cache-aside (lazy loading) pattern work?', 'back' => 'Application code manages the cache explicitly. On read: check cache → if miss, load from DB → populate cache → return. On write: update DB → invalidate (or update) cache. The cache only contains what was recently requested.', 'example' => 'Redis as cache-aside: check Redis for user profile → miss → query Postgres → store in Redis with TTL → return to client.', 'gotcha' => 'Cache-aside has a cold start problem — on first use or after cache flush, every request is a cache miss. Warm up critical data proactively if latency matters at startup.'],
            ['concept' => 'Write-Through Cache', 'category' => 'caching', 'front' => 'How does write-through caching work and how does it differ from cache-aside?', 'back' => 'On every write, the application writes to both the cache and the database synchronously. Reads always hit the cache (no cold start problem). The cache is always consistent with the DB, but writes are slower (two writes every time).', 'example' => 'A shopping cart: every cart update writes to Redis and Postgres simultaneously. Any read hits Redis instantly.', 'gotcha' => 'Write-through caches data that may never be read — if you write a million items but only read 10%, you\'ve cached 990k items unnecessarily. Cache-aside is more space-efficient.'],
            ['concept' => 'Cache Invalidation', 'category' => 'caching', 'front' => 'What are the main cache invalidation strategies and their trade-offs?', 'back' => 'TTL (time-to-live): expire entries after N seconds — simple, may serve stale data. Event-based invalidation: delete/update cache on write — accurate but coupling between writer and cache. Write-through: always update cache on write — consistent but doubles write cost.', 'example' => 'Product prices change rarely → TTL of 5 minutes is fine. User session → must be invalidated immediately on logout (event-based).', 'gotcha' => '"There are only two hard things in CS: cache invalidation and naming things." — Phil Karlton. When in doubt, use shorter TTLs and accept slight staleness over complex invalidation logic.'],
            ['concept' => 'Blue-Green Deployment', 'category' => 'deployment', 'front' => 'How does blue-green deployment achieve zero-downtime releases?', 'back' => 'Run two identical production environments (blue = live, green = idle). Deploy new version to green, run tests, then switch traffic from blue to green atomically (DNS or load balancer flip). If issues arise, flip back to blue instantly.', 'example' => 'AWS CodeDeploy blue-green: deploy v2 to new Auto Scaling group (green), run health checks, shift 100% of ALB traffic to green, terminate blue.', 'gotcha' => 'Blue-green requires 2× infrastructure cost and complicates stateful services. Database migrations must be backward-compatible with both versions during the cutover window.'],
            ['concept' => 'Canary Release', 'category' => 'deployment', 'front' => 'What is a canary release and when is it preferred over blue-green?', 'back' => 'Gradually shift traffic from old version to new version — e.g. 1% → 10% → 50% → 100%. Monitor error rates and latency at each stage. If metrics degrade, roll back immediately. Unlike blue-green, it limits blast radius to a small user percentage.', 'example' => 'New recommendation algorithm: 5% of users see new algo. After 1 hour with good metrics, expand to 25%, then 100%.', 'gotcha' => 'Canary requires robust observability — you must detect errors in 1% of traffic before they affect 100%. Percentile latency metrics (p99) are more sensitive than averages.'],
            ['concept' => 'Feature Flags', 'category' => 'deployment', 'front' => 'What are feature flags and how do they decouple deployment from release?', 'back' => 'Feature flags are runtime configuration that enables or disables features without deploying new code. Deploy code with features off, enable for % of users or specific users at runtime. Enables dark launches, gradual rollouts, and instant kill switches.', 'example' => 'New checkout flow: deploy code with flag OFF, enable for 5% of users, measure conversion, ramp to 100% or roll back — all without a new deployment.', 'gotcha' => 'Feature flags accumulate technical debt — old flags that are never cleaned up become dead code paths that no one dares remove. Schedule cleanup as part of the release process.'],
            ['concept' => 'N+1 Query Problem', 'category' => 'databases', 'front' => 'What is the N+1 query problem and how do you fix it?', 'back' => 'The N+1 problem occurs when code fetches a list (1 query), then fetches related data for each item (N queries), totaling N+1 queries. Fix: use eager loading (JOIN or IN clause) to fetch all related data in 1-2 queries.', 'example' => 'Fetching 100 posts and each post.author is a separate query = 101 queries. Fix: JOIN users on posts.author_id or use includes/preload.', 'gotcha' => 'ORMs hide N+1 by default — lazy loading makes it look efficient in code. Always check the generated SQL or use a query analyzer in development.'],
            ['concept' => 'Database Index Design', 'category' => 'databases', 'front' => 'What are the key principles of database index design?', 'back' => 'Indexes speed up reads but slow writes and consume storage. Index columns used in WHERE, JOIN ON, and ORDER BY clauses. Composite indexes: column order matters — queries must use a prefix of the index. Covering indexes include all SELECT columns, avoiding table lookups.', 'example' => "Query: SELECT email FROM users WHERE country = 'US' AND created_at > '2024-01-01'. Covering index: (country, created_at, email) — index-only scan.", 'gotcha' => 'More indexes is not better. Every index slows INSERT/UPDATE/DELETE. Index the queries you actually have, not the queries you imagine. EXPLAIN ANALYZE to verify index is used.'],
            ['concept' => 'CDN (Content Delivery Network)', 'category' => 'infrastructure', 'front' => 'What problems does a CDN solve and how does it work?', 'back' => 'A CDN caches static assets (images, JS, CSS, videos) at edge nodes geographically close to users. Reduces origin server load, reduces latency by serving from nearby PoPs, improves availability. Origin serves the CDN; CDN serves users.', 'example' => 'CloudFront: user in Tokyo requests image → CDN PoP in Tokyo has it → 20ms response. Without CDN → hits US origin → 200ms response.', 'gotcha' => 'CDNs only help for cacheable content. Dynamic, personalized, or real-time responses still hit your origin. Also: cache invalidation at CDN edges is eventual — stale content can persist.'],
            ['concept' => 'Backpressure', 'category' => 'resilience', 'front' => 'What is backpressure and why is it essential in distributed systems?', 'back' => 'Backpressure is a mechanism for a downstream system to signal to an upstream system to slow down or stop sending data. Without it, a fast producer can overwhelm a slow consumer, filling queues until the system crashes. Backpressure propagates flow control through the system.', 'example' => 'Kafka consumer lag: if consumer falls behind, the producer should slow ingestion or alert operators — not keep filling the Kafka topic unboundedly.', 'gotcha' => 'Ignoring backpressure leads to memory pressure, OOMKills, and cascading failures. Design systems to measure and expose consumer lag — then act on it.'],
        ];

        foreach ($cards as $card) {
            SeFlashcard::updateOrCreate(['concept' => $card['concept']], $card);
        }
    }
}
