<?php

namespace App\Events\Grading;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/** Broadcast when grading finishes — the client navigates to the feedback page. */
class Completed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public int $submissionId) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("submission.{$this->submissionId}");
    }

    public function broadcastAs(): string
    {
        return 'Grading\\Completed';
    }
}
