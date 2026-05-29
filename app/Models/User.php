<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password','level'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'password' => 'hashed'];
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function errorInstances(): HasMany
    {
        return $this->hasMany(ErrorInstance::class);
    }

    public function drillCards(): HasMany
    {
        return $this->hasMany(DrillCard::class);
    }

    public function vocabularyEntries(): HasMany { return $this->hasMany(VocabularyEntry::class); }
    public function drillSessions(): HasMany { return $this->hasMany(DrillSession::class); }

    public function streak(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Streak::class);
    }

    /** First initial for the avatar circle. */
    public function getInitialAttribute(): string
    {
        return strtoupper(mb_substr($this->name ?? '?', 0, 1));
    }
}
