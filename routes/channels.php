<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('submission.{id}', function ($user, int $id) {
    return $user->submissions()->whereKey($id)->exists();
});
