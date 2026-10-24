package org.pixelpit.backend.threads;

/** Aktivität eines Nutzers im Forum; zählt nur sichtbare Threads und Posts, Eröffnungsposts eingeschlossen. */
public record ForumActivity(long threadCount, long postCount) {
}
