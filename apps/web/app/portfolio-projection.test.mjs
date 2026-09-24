import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PortfolioProjectionError,
  projectPortfolioItem,
  projectPublicPortfolio,
} from './portfolio-projection.ts';

const realPublished = {
  id: 'portfolioreal0001',
  title: '  Rabata przy domu  ',
  projectClass: 'REAL_PROJECT',
  markedForPublication: true,
  summary: 'Nasadzenia cieniolubne przy tarasie.',
  locality: 'Warszawa',
};

const conceptPublished = {
  id: 'portfolioconcept01',
  title: 'Koncepcja ogrodu leśnego',
  projectClass: 'CONCEPT_PROJECT',
  markedForPublication: true,
  synthetic: true,
};

const illustrativePublished = {
  id: 'portfolioillustr01',
  title: 'Wizualizacja rabat bylinowych',
  projectClass: 'ILLUSTRATIVE_PROJECT',
  markedForPublication: true,
  synthetic: true,
};

test('a published real project projects without private fields', () => {
  const item = projectPortfolioItem(realPublished);
  assert.deepEqual(item, {
    id: 'portfolioreal0001',
    title: 'Rabata przy domu',
    projectClass: 'REAL_PROJECT',
    realization: true,
    synthetic: false,
    summary: 'Nasadzenia cieniolubne przy tarasie.',
    locality: 'Warszawa',
  });
  assert.equal(Object.hasOwn(item, 'price'), false);
  assert.equal(Object.hasOwn(item, 'awards'), false);
  assert.equal(Object.hasOwn(item, 'customerName'), false);
});

test('concept and illustrative stay distinct from realizations', () => {
  const concept = projectPortfolioItem(conceptPublished);
  assert.equal(concept.projectClass, 'CONCEPT_PROJECT');
  assert.equal(concept.realization, false);
  assert.equal(concept.synthetic, true);

  const illustrative = projectPortfolioItem(illustrativePublished);
  assert.equal(illustrative.projectClass, 'ILLUSTRATIVE_PROJECT');
  assert.equal(illustrative.realization, false);
});

test('unpublished projects stay off the public portfolio', () => {
  assert.equal(
    projectPortfolioItem({
      id: 'portfoliodraft0001',
      title: 'Szkic prywatny',
      projectClass: 'REAL_PROJECT',
      markedForPublication: false,
    }),
    null,
  );
  assert.deepEqual(
    projectPublicPortfolio([
      { ...realPublished, markedForPublication: false },
      conceptPublished,
    ]),
    {
      state: 'published',
      items: [
        {
          id: 'portfolioconcept01',
          title: 'Koncepcja ogrodu leśnego',
          projectClass: 'CONCEPT_PROJECT',
          realization: false,
          synthetic: true,
        },
      ],
    },
  );
});

test('an empty published set is absent', () => {
  assert.deepEqual(projectPublicPortfolio([]), { state: 'absent' });
  assert.deepEqual(
    projectPublicPortfolio([
      {
        id: 'portfoliodraft0002',
        title: 'Ukryty',
        projectClass: 'REAL_PROJECT',
        markedForPublication: false,
      },
    ]),
    { state: 'absent' },
  );
});

test('only an explicit true publication mark projects', () => {
  assert.equal(
    projectPortfolioItem({
      ...realPublished,
      markedForPublication: false,
    }),
    null,
  );
  assert.equal(
    projectPortfolioItem({
      id: 'portfolioreal0001',
      title: 'Rabata przy domu',
      projectClass: 'REAL_PROJECT',
      markedForPublication: 'false',
    }),
    null,
  );
  assert.equal(
    projectPortfolioItem({
      id: 'portfolioreal0001',
      title: 'Rabata przy domu',
      projectClass: 'REAL_PROJECT',
      markedForPublication: 1,
    }),
    null,
  );
});

test('unpublished drafts with private fields stay off without throwing', () => {
  assert.equal(
    projectPortfolioItem({
      id: 'portfoliodraft0003',
      title: 'Szkic z ceną',
      projectClass: 'REAL_PROJECT',
      markedForPublication: false,
      price: 12000,
    }),
    null,
  );
});

test('smuggled realization and non-boolean synthetic fail closed', () => {
  assert.throws(
    () =>
      projectPortfolioItem({
        ...realPublished,
        realization: true,
      }),
    /PORTFOLIO_REALIZATION_SMUGGLED/,
  );
  assert.throws(
    () =>
      projectPortfolioItem({
        ...realPublished,
        synthetic: 'true',
      }),
    /PORTFOLIO_SYNTHETIC_INVALID/,
  );
  const syntheticReal = projectPortfolioItem({
    ...realPublished,
    synthetic: true,
  });
  assert.equal(syntheticReal.realization, true);
  assert.equal(syntheticReal.synthetic, true);
});

test('private commercial and client fields stay off the public path', () => {
  for (const field of ['price', 'awards', 'customerName', 'address', 'email', 'phone']) {
    assert.throws(
      () =>
        projectPortfolioItem({
          ...realPublished,
          [field]: field === 'price' ? 12000 : field === 'awards' ? ['Nagroda'] : 'sekret',
        }),
      PortfolioProjectionError,
    );
  }
});

test('guessable ids and invented class values fail closed', () => {
  assert.throws(
    () =>
      projectPortfolioItem({
        ...realPublished,
        id: 'project1',
      }),
    /PORTFOLIO_ID_INVALID/,
  );
  assert.throws(
    () =>
      projectPortfolioItem({
        ...realPublished,
        projectClass: 'BEST_PROJECT',
      }),
    /PORTFOLIO_CLASS_INVALID/,
  );
  assert.throws(
    () =>
      projectPortfolioItem({
        ...realPublished,
        title: '',
      }),
    /PORTFOLIO_TITLE_INVALID/,
  );
});

test('portfolio list preserves published order and omits drafts', () => {
  const model = projectPublicPortfolio([
    conceptPublished,
    { ...realPublished, markedForPublication: false },
    illustrativePublished,
    realPublished,
  ]);
  assert.equal(model.state, 'published');
  assert.deepEqual(
    model.items.map((item) => item.id),
    ['portfolioconcept01', 'portfolioillustr01', 'portfolioreal0001'],
  );
});
