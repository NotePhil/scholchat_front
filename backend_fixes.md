# Backend Fixes Required

## 1. Update CoursProgrammerEntity.java
```java
@Column(name = "date_cours_prevue", nullable = true) // Change to nullable = true
private LocalDateTime dateCoursPrevue;

@Column(name = "date_debut_effectif", nullable = true) // Already nullable
private LocalDateTime dateDebutEffectif;

@Column(name = "date_fin_effectif", nullable = true) // Already nullable  
private LocalDateTime dateFinEffectif;
```

## 2. Update CoursProgrammerBusiness.java - Remove/Update Validation Methods

### Remove or update validateCourseScheduleDates():
```java
private void validateCourseScheduleDates(CoursProgrammer coursProgrammer) {
    // Remove the null check for dateCoursPrevue
    if (coursProgrammer.getDateCoursPrevue() != null && 
        coursProgrammer.getDateCoursPrevue().isBefore(LocalDateTime.now())) {
        throw new IllegalArgumentException("Cannot schedule a course in the past");
    }

    if (coursProgrammer.getDateDebutEffectif() != null && 
        coursProgrammer.getDateFinEffectif() != null &&
        coursProgrammer.getDateDebutEffectif().isAfter(coursProgrammer.getDateFinEffectif())) {
        throw new IllegalArgumentException("Start date cannot be after end date");
    }
}
```

### Remove or update validateEffectiveDates():
```java
private void validateEffectiveDates(CoursProgrammer coursProgrammer) {
    // Make all validations optional - only validate if dates are provided
    if (coursProgrammer.getDateDebutEffectif() != null && 
        coursProgrammer.getDateCoursPrevue() != null &&
        coursProgrammer.getDateDebutEffectif().isBefore(coursProgrammer.getDateCoursPrevue())) {
        throw new IllegalArgumentException("La date de début effective ne peut pas être avant la date prévue du cours.");
    }
    
    if (coursProgrammer.getDateDebutEffectif() != null && 
        coursProgrammer.getDateFinEffectif() != null &&
        coursProgrammer.getDateFinEffectif().isBefore(coursProgrammer.getDateDebutEffectif())) {
        throw new IllegalArgumentException("La date de fin effective doit être après la date de début effective.");
    }
}
```

## 3. Update Database Schema
```sql
ALTER TABLE ressources.cours_programmer 
ALTER COLUMN date_cours_prevue DROP NOT NULL;
```