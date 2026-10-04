# Section 1.1 Title

<!-- TEMPLATE: this page shows the syntax of every interactive element.
     Replace each placeholder with your own content and delete what you don't use. -->

## Subheading

Paragraph text.

> Note: Placeholder note text.

<Listing number="1-1" file-name="src/main.rs" caption="Placeholder caption">

```rust
fn main() {
    // placeholder
}
```

</Listing>

```rust,ignore,does_not_compile
fn main() {
    let x = 1;
    x = 2;
}
```

```aquascope,interpreter
fn main() {
    let a = Box::new(1);`[]`
    let b = a;`[]`
}
```

```aquascope,permissions,stepper,boundaries
fn main() {
    let mut v = vec![1];
    let r = &v[0];
    println!("{r}");
    v.push(2);
}
```

<figure>

<img src="img/placeholder.svg" alt="Placeholder" class="center" width="300" />

<figcaption>Figure 1-1: Placeholder caption</figcaption>

</figure>

{{#quiz ../quizzes/ch01-01-section-title.toml}}
