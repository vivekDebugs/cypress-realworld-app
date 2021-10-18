/// <reference types='cypress' />

describe("NEW TRANSACTION", () => {
  const userInfo = {
    firstName: "Arely",
    lastName: "Kertzmann",
    username: "Tavares_Barrows",
    password: "s3cret",
  };

  const receiverInfo = {
    firstName: "Edgar",
    lastName: "Johns",
    username: "Katharina_Bernier",
    password: "s3cret",
  };

  const paymentInfo = {
    amount: "10",
    description: "Candies",
  };

  beforeEach(function () {
    cy.task("db:seed");

    cy.intercept("GET", "/users*").as("allUsers");

    cy.intercept("GET", "/users/search*").as("usersSearch");

    cy.intercept("POST", "/transactions").as("createTransaction");

    cy.visit("http://localhost:3000/");
    cy.login(userInfo.username, userInfo.password);
    cy.log("USER LOGGED IN");
  });

  it("should take the user to new transaction route", () => {
    cy.getBySel("sidenav-newTransaction").click();
    cy.log("USER CLICKED ON NEW TRANSACTON");
    cy.url().should("include", "/transaction/new");

    cy.contains(`${userInfo.firstName}`).should("exist");
  });

  it("should go to new Transaction, select a user and initiate transaction, and check transaction history for the transaction made", () => {
    cy.getBySel("sidenav-newTransaction").click();
    cy.wait("@allUsers");
    cy.getBySel("user-list-search-input").type(
      `${receiverInfo.firstName} ${receiverInfo.lastName}`,
      { force: true }
    );
    cy.wait("@usersSearch");
    cy.getBySelLike("user-list-item").contains(receiverInfo.firstName).click({ force: true });
    cy.getBySelLike("amount-input").type(paymentInfo.amount);
    cy.getBySelLike("description-input").type(paymentInfo.description);
    cy.visualSnapshot("Amount and Description Input");
    cy.getBySelLike("submit-payment").click();

    cy.wait(["@createTransaction", "@getUserProfile"]);
    cy.getBySel("alert-bar-success")
      .should("be.visible")
      .and("have.text", "Transaction Submitted!");

    cy.getBySel("sidenav-home").click();
    cy.getBySel("nav-personal-tab").click();
    cy.contains(
      `${userInfo.firstName} ${userInfo.lastName} paid ${receiverInfo.firstName} ${receiverInfo.lastName}`
    ).should("exist");
    cy.contains(paymentInfo.description).should("exist");
  });
});
