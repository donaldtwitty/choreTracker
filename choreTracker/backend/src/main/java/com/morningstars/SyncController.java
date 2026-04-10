package com.morningstars;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SyncController {

    private final FamilyStateRepository repo;

    public SyncController(FamilyStateRepository repo) {
        this.repo = repo;
    }

    /** Create a new family — returns the generated familyId and version. */
    @PostMapping("/family")
    public ResponseEntity<Map<String, Object>> createFamily(@RequestBody String stateJson) {
        String id = UUID.randomUUID().toString().substring(0, 8);
        FamilyState fs = new FamilyState(id, stateJson);
        FamilyState saved = repo.save(fs);
        return ResponseEntity.ok(Map.of(
                "familyId", id,
                "version", saved.getVersion(),
                "updatedAt", saved.getUpdatedAt()
        ));
    }

    /** Join an existing family — returns the current state. */
    @GetMapping("/family/{familyId}")
    public ResponseEntity<?> getState(@PathVariable String familyId) {
        return repo.findById(familyId)
                .<ResponseEntity<?>>map(fs -> ResponseEntity.ok(Map.of(
                        "stateJson", fs.getStateJson(),
                        "version", fs.getVersion(),
                        "updatedAt", fs.getUpdatedAt()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Save state — the client sends its current version.
     * If the version matches, the update succeeds (last-write-wins within version).
     * If another device already wrote, the client gets a 409 with the latest state
     * so it can merge or overwrite.
     */
    @PutMapping("/family/{familyId}")
    public ResponseEntity<?> saveState(
            @PathVariable String familyId,
            @RequestParam(defaultValue = "0") Long expectedVersion,
            @RequestBody String stateJson) {

        return repo.findById(familyId)
                .<ResponseEntity<?>>map(fs -> {
                    try {
                        fs.setStateJson(stateJson);
                        FamilyState saved = repo.save(fs);
                        return ResponseEntity.ok(Map.of(
                                "version", saved.getVersion(),
                                "updatedAt", saved.getUpdatedAt()
                        ));
                    } catch (ObjectOptimisticLockingFailureException e) {
                        // Another device wrote first — return latest so client can retry
                        FamilyState latest = repo.findById(familyId).orElse(fs);
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                                "stateJson", latest.getStateJson(),
                                "version", latest.getVersion(),
                                "updatedAt", latest.getUpdatedAt()
                        ));
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Lightweight poll — client sends its last known version.
     * Returns 204 (no content) if nothing changed, or the new state if it did.
     */
    @GetMapping("/family/{familyId}/poll")
    public ResponseEntity<?> poll(
            @PathVariable String familyId,
            @RequestParam Long version) {

        return repo.findById(familyId)
                .<ResponseEntity<?>>map(fs -> {
                    if (fs.getVersion().equals(version)) {
                        return ResponseEntity.noContent().build();
                    }
                    return ResponseEntity.ok(Map.of(
                            "stateJson", fs.getStateJson(),
                            "version", fs.getVersion(),
                            "updatedAt", fs.getUpdatedAt()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
