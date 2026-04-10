package com.morningstars;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * Stores the entire family's chore-tracker state as a JSON document.
 *
 * @Lob is intentionally omitted: Hibernate 6 maps @Lob String to OID on
 * PostgreSQL (wrong type) and to CLOB on H2. Using @Column(columnDefinition
 * = "TEXT") alone works correctly for both databases.
 */
@Entity
@Table(name = "family_state")
public class FamilyState {

    @Id
    private String familyId;

    /** Optimistic locking — automatically incremented by JPA on every save. */
    @Version
    private Long version;

    /** Full state serialised as JSON. TEXT in both H2 and PostgreSQL. */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String stateJson;

    /** Unix-millis timestamp, updated by setStateJson(). */
    private long updatedAt;

    public FamilyState() {}

    public FamilyState(String familyId, String stateJson) {
        this.familyId  = familyId;
        this.stateJson = stateJson;
        this.updatedAt = System.currentTimeMillis();
    }

    public String getFamilyId()        { return familyId; }
    public void   setFamilyId(String id)   { this.familyId = id; }
    public Long   getVersion()         { return version; }
    public void   setVersion(Long v)   { this.version = v; }
    public String getStateJson()       { return stateJson; }
    public void   setStateJson(String j) {
        this.stateJson = j;
        this.updatedAt = System.currentTimeMillis();
    }
    public long   getUpdatedAt()       { return updatedAt; }
    public void   setUpdatedAt(long t) { this.updatedAt = t; }
}
