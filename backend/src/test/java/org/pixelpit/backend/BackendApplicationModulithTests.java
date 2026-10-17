package org.pixelpit.backend;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

public class BackendApplicationModulithTests {
    private final ApplicationModules modules = ApplicationModules.of(BackendApplication.class);

    @Test
    void verifyModules() {
        modules.verify();
    }

    @Test
    void writeDocumentationSnippets() {
        new Documenter(modules)
                .writeModuleCanvases()
                .writeModulesAsPlantUml()
                .writeDocumentation()
                .writeAggregatingDocument()
                .writeIndividualModulesAsPlantUml();
    }
}
