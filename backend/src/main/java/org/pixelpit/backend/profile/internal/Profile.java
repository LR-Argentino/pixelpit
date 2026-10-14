package org.pixelpit.backend.profile.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // NULL nach Anonymisierung
    @Column(name = "account_id", unique = true)
    private Integer accountId;

    // 'deleted-<id>' nach Anonymisierung
    @Column(name = "username", nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "avatar_file_id", unique = true)
    private Integer avatarFileId;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Profile(Integer accountId, String username) {
        this.accountId = accountId;
        this.username = username;
    }
}
