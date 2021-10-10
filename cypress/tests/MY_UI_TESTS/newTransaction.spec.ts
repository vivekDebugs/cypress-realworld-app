/// <reference types='cypress' />

describe("NEW TRANSACTION", () => {
  it("should take the user to new transaction route", () => {
    cy.visit("http://localhost:3000/");
    const userInfo = {
      firstName: "Arely",
      lastName: "Kertzmann",
      username: "Tavares_Barrows",
      password: "s3cret",
    };

    cy.login(userInfo.username, userInfo.password);
    cy.log("USER LOGGED IN");
    cy.getBySel("sidenav-newTransaction").click();
    cy.log("USER CLICKED ON NEW TRANSACTON");
    cy.url().should("include", "/transaction/new");

    cy.contains(`${userInfo.firstName}`).should("exist");
  });
});
