package org.pixelpit.backend.threads;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import javax.sql.DataSource;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class CategoryIT {
    private static final String CATEGORIES_URL = "/api/categories";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DataSource dataSource;

    @BeforeEach
    @AfterEach
    void truncate() {
        jdbcTemplate.update("""
                TRUNCATE threads_categories, posts, threads, categories, profiles, accounts
                RESTART IDENTITY CASCADE
                """);
    }

    @Test
    void listCategories_returnsAllSortedByName_whenGuest() {
        int showcase = createCategory("Showcase");
        int engines = createCategory("Engines");
        int offTopic = createCategory("Off-Topic");

        MvcTestResult result = mvc.get().uri(CATEGORIES_URL).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$[*].id").isEqualTo(List.of(engines, offTopic, showcase));
        assertThat(result).bodyJson().extractingPath("$[*].name")
                .isEqualTo(List.of("Engines", "Off-Topic", "Showcase"));
    }

    @Test
    void listCategories_returnsEmptyList_whenNoCategoriesExist() {
        MvcTestResult result = mvc.get().uri(CATEGORIES_URL).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.length()").isEqualTo(0);
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "MODERATOR", "ADMIN"})
    void listCategories_returnsSameList_whenLoggedInWithAnyRole(String role) throws Exception {
        createCategory("Showcase");
        createCategory("Engines");
        String guestBody = mvc.get().uri(CATEGORIES_URL).exchange().getResponse().getContentAsString();

        MvcTestResult result = mvc.get().uri(CATEGORIES_URL).with(user("blackbird").roles(role)).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().isStrictlyEqualTo(guestBody);
    }

    @Test
    void postCategories_returnsUnauthorized_whenGuest() {
        MvcTestResult result = mvc.post().uri(CATEGORIES_URL).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"Game Design\"}").exchange();

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(countCategories()).isZero();
    }

    @Test
    void listCategories_returnsSeededCategories_afterSeedChangeset() {
        new ResourceDatabasePopulator(new ClassPathResource("db/changelog/changes/004-seed-categories.sql"))
                .execute(dataSource);

        MvcTestResult result = mvc.get().uri(CATEGORIES_URL).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$[*].name")
                .isEqualTo(List.of("Engines", "Off-Topic", "Programmierung", "Showcase"));
    }

    @Test
    void seedChangeset_addsOnlyMissingCategories_whenSomeAlreadyExist() {
        int engines = createCategory("Engines");
        createCategory("Grafik");

        new ResourceDatabasePopulator(new ClassPathResource("db/changelog/changes/004-seed-categories.sql"))
                .execute(dataSource);

        MvcTestResult result = mvc.get().uri(CATEGORIES_URL).exchange();
        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$[*].name")
                .isEqualTo(List.of("Engines", "Grafik", "Off-Topic", "Programmierung", "Showcase"));
        assertThat(result).bodyJson().extractingPath("$[0].id").isEqualTo(engines);
    }

    @Test
    void createCategory_isRejected_whenNameAlreadyExists() {
        createCategory("Engines");

        assertThatThrownBy(() -> createCategory("Engines")).isInstanceOf(DataIntegrityViolationException.class);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT count(*) FROM categories WHERE name = 'Engines'", Integer.class)).isEqualTo(1);
    }

    private int createCategory(String name) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO categories (name) VALUES (?) RETURNING id", Integer.class, name);
    }

    private int countCategories() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM categories", Integer.class);
    }
}
