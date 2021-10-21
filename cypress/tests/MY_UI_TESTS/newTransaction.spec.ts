/// <reference types='cypress' />
import Dinero from "dinero.js";
import { User } from "../../../src/models";

type NewTransactionTestDataType = {
  allUsers?: User[];
  user?: User;
  contact?: User;
};

describe("NEW TRANSACTION", () => {
  const testData: NewTransactionTestDataType = {};

  const paymentInfo = {
    amount: "10",
    description: "Candies",
  };

  beforeEach(function () {
    cy.task("db:seed");

    // setting aliases for routes
    cy.intercept("GET", "/users*").as("allUsers");

    cy.intercept("GET", "/users/search*").as("usersSearch");

    cy.intercept("POST", "/transactions").as("createTransaction");

    cy.intercept("GET", "/notifications").as("notifications");
    cy.intercept("GET", "/transactions/public").as("publicTransactions");
    cy.intercept("GET", "/transactions").as("personalTransactions");
    cy.intercept("PATCH", "/transactions/*").as("updateTransaction");

    // getting users from the database
    cy.database("filter", "users").then((users: User[]) => {
      testData.allUsers = users;
      testData.user = users[0];
      testData.contact = users[1];

      // user LogIn

      return cy.loginByXstate(testData.user.username);
    });
  });

  it("should take the user to new transaction route upon clicking on 'New'", () => {
    // click on NEW
    cy.getBySel("sidenav-newTransaction").click();
    cy.log("USER CLICKED ON NEW TRANSACTON");
    // check if user is taken to '/transaction/new' route
    cy.url().should("include", "/transaction/new");

    // User's firstName should exit
    cy.contains(`${testData.user?.firstName}`).should("exist");
  });

  it("should go to new Transaction, select a user and initiate transaction, and check transaction history for the transaction made", () => {
    cy.getBySel("sidenav-newTransaction").click();
    cy.wait("@allUsers");

    // type the receiver's name in the input field
    cy.getBySel("user-list-search-input").type(
      `${testData.contact!.firstName} ${testData.contact!.lastName}`,
      { force: true }
    );
    cy.wait("@usersSearch");
    // select the receiver by clicking
    cy.getBySelLike("user-list-item").contains(testData.contact!.firstName).click({ force: true });
    // enter the amount and description of the transaction
    cy.getBySelLike("amount-input").type(paymentInfo.amount);
    cy.getBySelLike("description-input").type(paymentInfo.description);
    // click on pay
    cy.getBySelLike("submit-payment").click();

    // wait for @createTransaction request
    cy.wait(["@createTransaction", "@getUserProfile"]);
    // after successful transaciton, 'create another transaction' button should be visible
    cy.getBySel("new-transaction-create-another-transaction").should("be.visible");

    // go to personal transactions tab, HOME -> MINE
    cy.getBySel("sidenav-home").click();
    cy.getBySel("nav-personal-tab").click();
    // transaction history should contain the recent transaction made
    // eg, personA paid personB
    cy.contains(
      `${testData.user!.firstName} ${testData.user!.lastName} paid ${testData.contact!.firstName} ${
        testData.contact!.lastName
      }`
    ).should("exist");
    // paymentDescription should exist in the transaction history
    cy.contains(paymentInfo.description).should("exist");
  });

  it("should initiate another transaction and check if the amount is deposited to the receiver account", function () {
    cy.getBySel("sidenav-newTransaction").click();

    const transactionPayload = {
      transactionType: "payment",
      amount: 5,
      description: "Hummus",
      sender: testData.user,
      receiver: testData.contact,
    };

    // getting the initial balance of the sender prior sending money
    let startBalance: string;
    cy.get("[data-test=sidenav-user-balance]")
      .invoke("text")
      .then((x) => {
        startBalance = x;
        expect(startBalance).to.match(/\$\d/);
      });

    // initiating Transaction using XState
    cy.createTransaction(transactionPayload);

    // waiting for the request to get resolved
    cy.wait("@createTransaction");

    // 'create another transaction' button should be visible
    cy.getBySel("new-transaction-create-another-transaction").should("be.visible");

    // checking if sender's current balance is not to the initial balance
    cy.get("[data-test=sidenav-user-balance]").should(($el) => {
      expect($el.text()).to.not.equal(startBalance);
    });

    // logging in with receiver's account
    cy.switchUserByXstate(testData.contact!.username);

    // calculating updatedBalance
    const updatedAccountBalance = Dinero({
      amount: testData.contact!.balance + transactionPayload.amount * 100,
    }).toFormat();

    // checking if the receiver's balance is equal to the updatedBalance
    cy.getBySelLike("user-balance").should("contain", updatedAccountBalance);

    // Switch to the personal transactions tab, HOME -> MINE
    cy.getBySel("sidenav-home").click();
    cy.getBySel("nav-personal-tab").click();

    // transaction history should contain -> senderName paid receiverName, and description
    cy.contains(
      `${testData.user!.firstName} ${testData.user!.lastName} paid ${testData.contact!.firstName} ${
        testData.contact!.lastName
      }`
    ).should("exist");
    cy.contains(transactionPayload.description).should("exist");
  });
});
