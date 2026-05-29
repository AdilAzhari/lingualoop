<?php

namespace App\Events\Grading;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/** Broadcast as the grading job moves through its phases (0..3). */
class PhaseAdvanced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public int $submissionId, public int $phase) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("submission.{$this->submissionId}");
    }

    public function broadcastAs(): string
    {
        return 'Grading\\PhaseAdvanced';
    }

    /** @return array{phase:int} */
    public function broadcastWith(): array
    {
        return ['phase' => $this->phase];
    }
}
