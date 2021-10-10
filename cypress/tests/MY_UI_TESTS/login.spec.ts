/// <reference types='cypress' />

describe("USER LOGIN", () => {
  it("should allow user to login", () => {
    cy.visit("http://localhost:3000/");
    const userInfo = {
      firstName: "Edgar",
      lastName: "Johns",
      username: "Katharina_Bernier",
      password: "s3cret",
    };

    cy.login(userInfo.username, userInfo.password);
    cy.getBySel("sidenav-home").should("be.visible");
    cy.get("[data-test=sidenav-user-settings]").should("be.visible");
    cy.getBySel("sidenav-bankaccounts").should("be.visible");
    cy.getBySel("sidenav-notifications").should("be.visible");
    cy.getBySel("sidenav-newTransaction").should("be.visible");
    cy.getBySel("sidenav-signout").should("be.visible");

    cy.contains(`@${userInfo.username}`).should("exist");
    cy.contains(`${userInfo.firstName}`).should("exist");
  });
});
